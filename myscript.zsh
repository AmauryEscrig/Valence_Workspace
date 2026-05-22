#!/bin/zsh

# Define the root path (adjust if necessary)
ROOT_DIR="$HOME/Desktop/Valence_Workspace"

# AppleScript to open two separate terminal windows and run commands
osascript <<EOF
tell application "Terminal"
    # Window 1: Valence-UI
    activate
    set w1 to do script "cd \"$ROOT_DIR/valence-ui\" && npm run dev"
    
    #Timeout of X seconds
    delay 2.5

    # Window 2: ValInfra
    set w2 to do script "cd \"$ROOT_DIR/ValInfra/build\" && cmake .. && make && ./ValInfra"
end tell
EOF
