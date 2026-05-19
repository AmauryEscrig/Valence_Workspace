cmake_minimum_required(VERSION 3.20)
project(ValInfra)

# Force compilation commands for VS Code IntelliSense
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_CXX_STANDARD 20)

# Disable the broken Homebrew config search for Boost
set(Boost_NO_BOOST_CMAKE ON)
set(BOOST_ROOT "/opt/homebrew")
set(BOOST_INCLUDEDIR "/opt/homebrew/include")
set(BOOST_LIBRARYDIR "/opt/homebrew/lib")

# Find Boost
find_package(Boost REQUIRED)

# Define our single backend executable
add_executable(ValInfra 
    src/main.cpp 
    src/OrderBook.cpp
    include/WebGateway.hpp
    include/Simulation.hpp
)

# Set the search paths for headers
target_include_directories(ValInfra PRIVATE 
    /opt/homebrew/include               # Global Homebrew headers (Boost)
    ${CMAKE_CURRENT_SOURCE_DIR}/include # Local .hpp headers
    ${CMAKE_CURRENT_SOURCE_DIR}/src     # Local internal headers
)

# Link the libraries
target_link_libraries(ValInfra PRIVATE ${Boost_LIBRARIES})