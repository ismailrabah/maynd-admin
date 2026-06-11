#!/bin/bash
echo "Setting up Maynd.ma Admin Dashboard..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
echo "Installation complete!"
echo "To start: npm run dev"
