import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        toast.error('No accounts found. Please make sure MetaMask is unlocked.');
        return false;
      }

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      toast.success('Wallet connected successfully!');
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error('Failed to connect wallet');
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    toast.info('Wallet disconnected');
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      toast.error('Failed to switch network');
      return false;
    }
  };

  // Sign message
  const signMessage = async (message) => {
    if (!signer) {
      toast.error('Wallet not connected');
      return null;
    }

    try {
      console.log('🔍 Web3Context - Signing message:', JSON.stringify(message));
      console.log('🔍 Web3Context - Message length:', message.length);
      console.log('🔍 Web3Context - Message bytes:', new TextEncoder().encode(message));
      
      const signerAddress = await signer.getAddress();
      console.log('🔍 Web3Context - Signer address:', signerAddress);
      
      // Ensure message is properly formatted
      const normalizedMessage = message.toString();
      console.log('🔍 Web3Context - Normalized message:', JSON.stringify(normalizedMessage));
      
      const signature = await signer.signMessage(normalizedMessage);
      console.log('🔍 Web3Context - Generated signature:', signature);
      
      // Verify signature locally before returning
      try {
        const { ethers: ethersVerify } = await import('ethers');
        const recoveredAddress = ethersVerify.verifyMessage(normalizedMessage, signature);
        console.log('🔍 Web3Context - Local verification - Recovered address:', recoveredAddress);
        console.log('🔍 Web3Context - Local verification - Expected address:', signerAddress);
        console.log('🔍 Web3Context - Local verification - Match:', recoveredAddress.toLowerCase() === signerAddress.toLowerCase());
      } catch (verifyError) {
        console.warn('🔍 Web3Context - Local verification failed:', verifyError);
      }
      
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      if (error.code === 4001) {
        toast.error('Signature rejected by user');
      } else {
        toast.error('Failed to sign message: ' + (error.message || 'Unknown error'));
      }
      return null;
    }
  };

  // Check if already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          toast.info('Account changed');
        }
      };

      const handleChainChanged = (chainId) => {
        setChainId(parseInt(chainId, 16));
        toast.info('Network changed');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const value = {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    signMessage,
    isMetaMaskInstalled,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};