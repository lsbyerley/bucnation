import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { WebBundlr } from '@bundlr-network/client';
import { AppContext } from '@/context';
import Layout from '@/components/Layout';
import { APP_NAME } from '@/lib/constants';
import { useState, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { chain, createClient, WagmiConfig, configureChains } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { VideoProvider } from '@/components/VideoProvider';

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID;

const { chains, provider } = configureChains(
  [chain.polygon, chain.polygonMumbai],
  [alchemyProvider({ apiKey: alchemyId }), publicProvider()]
);

const { connectors } = getDefaultWallets({ appName: APP_NAME, chains });
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const MyApp = ({ Component, pageProps }) => {
  const [isMounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [bundlrInstance, setBundlrInstance] = useState();
  const [balance, setBalance] = useState(0);

  // set the base currency as matic (this can be changed later in the app)
  const [currency, setCurrency] = useState('matic');
  const bundlrRef = useRef();

  const initializeBundlr = async (wagmiProvider) => {
    //TODO: wagmiProvider does not work when initializing bundlr
    await window.ethereum.enable();

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider._ready();

    const bundlr = new WebBundlr(
      'https://node1.bundlr.network',
      currency,
      provider
    );
    await bundlr.ready();

    setBundlrInstance(bundlr);
    bundlrRef.current = bundlr;
    fetchBalance();
  };

  const fetchBalance = async () => {
    const balance = await bundlrRef.current.getLoadedBalance();
    console.log('bal: ', ethers.utils.formatEther(balance.toString()));
    setBalance(ethers.utils.formatEther(balance.toString()));
  };

  if (!isMounted) return null;

  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <AppContext.Provider
          value={{
            initializeBundlr,
            bundlrInstance,
            setBundlrInstance,
            balance,
            fetchBalance,
            currency,
            setCurrency,
          }}
        >
          <VideoProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </VideoProvider>
        </AppContext.Provider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default MyApp;
