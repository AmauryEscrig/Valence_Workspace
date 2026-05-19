#include "OrderBook.hpp"
#include <iostream>
#include <algorithm>
#include <vector>
#include <utility>

void OrderBook::addOrder(uint64_t id, double price, uint32_t quantity, OrderSide side) {
    std::lock_guard<std::mutex> lock(book_mutex);
    
    if (side == OrderSide::Buy) {
        bids[price] += quantity;
    } else {
        asks[price] += quantity;
    }

    match();
}

void OrderBook::match() {
    // Safe check to ensure we have both bids and asks before attempting a cross
    while (!bids.empty() && !asks.empty()) {
        
        // NOTE: For this to work correctly, your .hpp MUST define bids as:
        // std::map<double, uint32_t, std::greater<double>> bids; 
        // This ensures bids.begin() grabs the HIGHEST buying price.
        auto itBid = bids.begin();
        auto itAsk = asks.begin();

        // If highest bid >= lowest ask, execute trade
        if (itBid->first >= itAsk->first) {
            uint32_t matchedQty = std::min(itBid->second, itAsk->second);
            
            std::cout << "[MATCH] Trade Executed at $" << itAsk->first 
                      << " | Quantity: " << matchedQty << std::endl;

            itBid->second -= matchedQty;
            itAsk->second -= matchedQty;

            // MEMORY MANAGEMENT: Kill the price level if liquidity hits 0
            if (itBid->second == 0) bids.erase(itBid);
            if (itAsk->second == 0) asks.erase(itAsk);
        } else {
            break; // Spread is restored, stop matching
        }
    }
}

void OrderBook::printState() const {
    std::lock_guard<std::mutex> lock(book_mutex);
    std::cout << "--- Current Order Book Spread ---" << std::endl;
    
    std::cout << "Asks (Sells):" << std::endl;
    for (auto const& [price, qty] : asks) {
        std::cout << "  $" << price << " | Qty: " << qty << std::endl;
    }
    
    std::cout << "Bids (Buys):" << std::endl;
    for (auto const& [price, qty] : bids) {
        std::cout << "  $" << price << " | Qty: " << qty << std::endl;
    }
    std::cout << "---------------------------------" << std::endl;
}

// =========================================================================
// WEBSOCKET BROADCASTER PAYLOAD GENERATOR
// =========================================================================
MarketDepthSnapshot OrderBook::getDepth(size_t max_levels) const {
    std::lock_guard<std::mutex> lock(book_mutex);
    MarketDepthSnapshot snapshot;

    // Grab top buy levels (L2 Depth)
    size_t count = 0;
    for (auto const& [price, qty] : bids) {
        if (count++ >= max_levels) break;
        snapshot.bids.push_back({price, qty});
    }

    // Grab top sell levels (L2 Depth)
    count = 0;
    for (auto const& [price, qty] : asks) {
        if (count++ >= max_levels) break;
        snapshot.asks.push_back({price, qty});
    }

    return snapshot;
}