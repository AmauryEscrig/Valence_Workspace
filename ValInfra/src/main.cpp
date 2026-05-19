#include <iostream>
#include <boost/asio.hpp>
#include "OrderBook.hpp"
#include "Simulation.hpp"
#include "WebGateway.hpp"

int main() {
    std::cout << "========================================" << std::endl;
    std::cout << "      VALENCE CORE INFRASTRUCTURE       " << std::endl;
    std::cout << "========================================" << std::endl;

    try {
        boost::asio::io_context ioc;
        OrderBook book;

        // 1. Start the automated background trading simulation
        Simulation sim(book);
        sim.start();

        // 2. Start the WebSocket Web Gateway on Port 8080
        WebGateway gateway(ioc, 8080, book);

        // 3. Run the async execution loop (this blocks the main thread)
        std::cout << "[SYSTEM] Engine core network loop running..." << std::endl;
        ioc.run();

    } catch (std::exception const& e) {
        std::cerr << "[FATAL] Critical System Exception: " << e.what() << std::endl;
        return 1;
    }

    return 0;
}