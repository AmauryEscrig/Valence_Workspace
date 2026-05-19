#pragma once
#include <map>
#include <string>
#include <mutex>
#include <vector>

enum class OrderSide { Buy, Sell };

// Direct price-level aggregation for the UI
struct BookLevel {
    double price;
    uint32_t quantity;
};

struct MarketDepthSnapshot {
    std::vector<BookLevel> bids;
    std::vector<BookLevel> asks;
};

struct Order {
    uint64_t id;
    double price;
    uint32_t quantity;
    OrderSide side;
};

class OrderBook {
public:
    void addOrder(uint64_t id, double price, uint32_t quantity, OrderSide side);
    MarketDepthSnapshot getDepth(size_t max_levels) const; // <--- The new snapshot fetcher
    void printState() const;

private:
    mutable std::mutex book_mutex; 
    std::map<double, uint32_t, std::greater<double>> bids; 
    std::map<double, uint32_t> asks;                      

    void match();
};