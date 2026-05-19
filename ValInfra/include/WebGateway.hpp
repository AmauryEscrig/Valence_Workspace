#pragma once
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <iostream>
#include <memory>
#include <string>
#include <thread>
#include <chrono>
#include "OrderBook.hpp"

namespace net = boost::asio;            
using tcp = boost::asio::ip::tcp;       
namespace websocket = boost::beast::websocket; 

class WebSession : public std::enable_shared_from_this<WebSession> {
public:
    explicit WebSession(tcp::socket socket, OrderBook& book)
        : ws_(std::move(socket)), book_(book) {}

    void run() {
        // Set up the WebSocket stream timeout settings
        ws_.set_option(websocket::stream_base::timeout::suggested(boost::beast::role_type::server));

        // Accept the websocket handshake asynchronously
        ws_.async_accept([self = shared_from_this()](boost::beast::error_code ec) {
            if (!ec) {
                std::cout << "[WEBSOCKET] Client Connected from Web UI!" << std::endl;
                self->do_write_loop();
            } else {
                std::cerr << "[WEBSOCKET ERROR] Accept failed: " << ec.message() << std::endl;
            }
        });
    }

private:
    void do_write_loop() {
      // 1. Fetch the absolute latest live market depth (top 5 levels)
      MarketDepthSnapshot snapshot = book_.getDepth(5);

      // 2. Manually construct a bulletproof JSON string payload
      std::string json = "{";
      json += "\"status\":\"ONLINE\",";
      
      // Serialize Bids
      json += "\"bids\":[";
      for (size_t i = 0; i < snapshot.bids.size(); ++i) {
          json += "[" + std::to_string(snapshot.bids[i].price) + "," + std::to_string(snapshot.bids[i].quantity) + "]";
          if (i < snapshot.bids.size() - 1) json += ",";
      }
      json += "],";

      // Serialize Asks
      json += "\"asks\":[";
      for (size_t i = 0; i < snapshot.asks.size(); ++i) {
          json += "[" + std::to_string(snapshot.asks[i].price) + "," + std::to_string(snapshot.asks[i].quantity) + "]";
          if (i < snapshot.asks.size() - 1) json += ",";
      }
      json += "]";
      json += "}";

      // 3. Blast the live memory matrix down the socket pipe
      ws_.async_write(net::buffer(json),
          [self = shared_from_this()](boost::beast::error_code ec, std::size_t bytes) {
              if (!ec) {
                  // Throttle to 100ms for high-frequency updates without bottlenecking the thread
                  std::this_thread::sleep_for(std::chrono::milliseconds(100));
                  self->do_write_loop();
              } else {
                  std::cout << "[WEBSOCKET] Client disconnected safely." << std::endl;
              }
          });
  }

    websocket::stream<tcp::socket> ws_;
    OrderBook& book_;
};

class WebGateway {
public:
    WebGateway(net::io_context& ioc, short port, OrderBook& book)
        : acceptor_(ioc), book_(book) {
        
        // Force an explicit resolution to localhost address space
        tcp::endpoint endpoint(net::ip::make_address("127.0.0.1"), port);
        
        acceptor_.open(endpoint.protocol());
        acceptor_.set_option(net::socket_base::reuse_address(true)); // Prevents port-lock on restarts
        acceptor_.bind(endpoint);
        acceptor_.listen();

        std::cout << "[INIT] Web Gateway successfully listening on ws://127.0.0.1:" << port << std::endl;
        do_accept();
    }

private:
    void do_accept() {
        // Explicitly pull the executor loop into the incoming socket instantiations
        acceptor_.async_accept(
            net::make_strand(acceptor_.get_executor()),
            [this](boost::beast::error_code ec, tcp::socket socket) {
                if (!ec) {
                    std::make_shared<WebSession>(std::move(socket), book_)->run();
                } else {
                    std::cerr << "[WEBSOCKET ERROR] Connection dropped during handshake: " << ec.message() << std::endl;
                }
                do_accept(); // Keep the listening cycle alive
            });
    }

    tcp::acceptor acceptor_;
    OrderBook& book_;
};