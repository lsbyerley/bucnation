import '../styles/globals.css';
import { WebBundlr } from '@bundlr-network/client';
import { AppContext } from '@/context';
import Layout from '@/components/Layout';
import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';

const MyApp = ({ Component, pageProps }) => {
  const [bundlrInstance, setBundlrInstance] = useState();
  const [balance, setBalance] = useState(0);

  // set the base currency as matic (this can be changed later in the app)
  const [currency, setCurrency] = useState('matic');
  const bundlrRef = useRef();

  const initializeBundlr = async () => {
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

  /*return (
    <div>
      <nav className=''>
        <Link href='/'>
          <a>
            <div className=''>
              <p className=''>ARWEAVE VIDEO</p>
            </div>
          </a>
        </Link>
      </nav>
      <div className=''>
        <AppContext.Provider
          value={{
            initializeBundlr,
            bundlrInstance,
            balance,
            fetchBalance,
            currency,
            setCurrency,
          }}
        >
          <Component {...pageProps} />
        </AppContext.Provider>
      </div>
      <footer className=''>
        <Link href='/upload'>
          <a>ADMIN</a>
        </Link>
      </footer>
    </div>
  ); */

  return (
    <div>
      <AppContext.Provider
        value={{
          initializeBundlr,
          bundlrInstance,
          balance,
          fetchBalance,
          currency,
          setCurrency,
        }}
      >
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppContext.Provider>
    </div>
  );
};

export default MyApp;
