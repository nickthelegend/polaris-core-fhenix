# 🚀 Link Your Smart Contracts

## Quick Setup (5 minutes)

### 1. Get Your Wallet Mnemonic
- Open your Algorand wallet (Pera, Defly, etc.)
- Go to Settings → Export/Backup → Copy mnemonic phrase
- Make sure you have at least 1 ALGO for deployment

### 2. Update Deploy Script
Edit `scripts/deploy.js` line 8:
```javascript
const MNEMONIC = 'your 25 word mnemonic phrase here';
```

### 3. Deploy Contracts
```bash
npm run deploy:contracts
```

### 4. Check Connection
- Go to your app: http://localhost:3000/piggy
- Look for green "Contracts Connected" indicator
- If red, contracts aren't deployed properly

## What This Does

✅ **Links your .algo.ts files to frontend**  
✅ **Updates contract IDs automatically**  
✅ **Enables real contract calls**  
✅ **Shows connection status**  

## Current Status
- Contract files: ✅ Ready
- Dependencies: ✅ Installed  
- Deploy script: ✅ Created
- **Next**: Run `npm run deploy:contracts`

## Troubleshooting

**"Insufficient balance"** → Add ALGO to your wallet  
**"Connection failed"** → Check internet/Algorand network  
**"Contracts Disconnected"** → Run deploy script again  

Your contracts will be fully linked after deployment! 🎉