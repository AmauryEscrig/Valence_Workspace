#pragma once
#include <thread>
#include <chrono>
#include <random>
#include <atomic>
#include <iostream>
#include <cmath>
#include "OrderBook.hpp"

class Simulation {
public:
    Simulation(OrderBook& book) : book_(book), running_(false) {}

    ~Simulation() {
        stop();
    }

    void start() {
        running_ = true;
        worker_thread_ = std::thread(&Simulation::run, this);
        std::cout << "[SIMULATOR] HFT Wide Bell-Curve Market Maker Bot Started." << std::endl;
    }

    void stop() {
        if (running_) {
            running_ = false;
            if (worker_thread_.joinable()) {
                worker_thread_.join();
            }
            std::cout << "[SIMULATOR] Background Market Maker Bot Stopped." << std::endl;
        }
    }

private:
    void run() {
        uint64_t order_id = 1000; 
        double current_mid = 100.00;

        // Setup random number generators
        std::random_device rd;
        std::mt19937 gen(rd());
        
        // Mid-price drift: slowly moves the "true value" of the asset up or down
        std::normal_distribution<double> mid_drift(0.0, 0.15); 
        
        // WIDE Bell Curve distribution for order placement
        // Standard dev of $0.66 pushes 99.7% of orders within a +/- $2.00 range (2%)
        std::normal_distribution<double> price_curve(0.0, 2.6); 
        
        // Quantities between 1 and 40 for thicker walls
        std::uniform_int_distribution<> qty_gen(1, 80);          
        std::uniform_int_distribution<> coin_toss(0, 1);

        while (running_) {
            // 1. Very slightly drift the center of the market to simulate macro movement
            current_mid += mid_drift(gen);

            // 2. Pull a random price off the Bell Curve centered around our current mid
            double raw_price = current_mid + price_curve(gen);

            // 3. Snap the price strictly to $0.05 tick increments
            double snapped_price = std::round(raw_price / 0.05) * 0.05;

            // 4. Smart Side Logic: Buy below the mid, Sell above the mid.
            OrderSide side;
            if (snapped_price < current_mid) {
                side = OrderSide::Buy;
            } else if (snapped_price > current_mid) {
                side = OrderSide::Sell;
            } else {
                side = (coin_toss(gen) == 0) ? OrderSide::Buy : OrderSide::Sell;
            }

            uint32_t quantity = qty_gen(gen);

            // 5. Inject into the concurrent OrderBook
            std::cout << "[AGENT] Routing Order #" << order_id << " | " 
                      << (side == OrderSide::Buy ? "BUY" : "SELL") 
                      << " " << quantity << " @ $" << snapped_price << std::endl;
                      
            book_.addOrder(order_id++, snapped_price, quantity, side);

            // 6. Ultra-High-Frequency Throttle (10ms) to ensure the wider DOM fills up
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        }
    }

    OrderBook& book_;
    std::atomic<bool> running_;
    std::thread worker_thread_;
};