import { useState, useContext, useRef } from 'react';
import Head from 'next/head';
import { AppContext } from '@/context';
import { APP_NAME } from '@/utils';
import { useRouter } from 'next/router';
import { utils } from 'ethers';
import Select from 'react-select';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSigner, useProvider, useDisconnect } from 'wagmi';
import Container from '@/components/Container';

const ALLOWED_UPLOADER_ADDRESS = process.env.NEXT_PUBLIC_ALLOWED_UPLOAD_ADDR;

const supportedCurrencies = {
  matic: 'matic',
  ethereum: 'ethereum',
  // avalanche: 'avalanche',
  // bnb: 'bnb',
  // arbitrum: 'arbitrum',
};

const currencyOptions = Object.keys(supportedCurrencies).map((v) => {
  return {
    value: v,
    label: v,
  };
});

const sports = {
  football: 'Football',
  mbasketball: 'Mens Basketball',
  baseball: 'Baseball',
};

const sportOptions = Object.keys(sports).map((s) => {
  return {
    value: s,
    label: sports[s],
  };
});

const Upload = () => {
  const {
    balance,
    bundlrInstance,
    setBundlrInstance,
    initializeBundlr,
    currency,
    setCurrency,
  } = useContext(AppContext);
  const [file, setFile] = useState();
  const [localVideo, setLocalVideo] = useState();
  const [title, setTitle] = useState('');
  const [fileCost, setFileCost] = useState();
  const [description, setDescription] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [sport, setSport] = useState('');
  const router = useRouter();
  const fileInputRef = useRef();

  const provider = useProvider();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const [URI, setURI] = useState();

  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    checkUploadCost(file.size);
    if (file) {
      const video = URL.createObjectURL(file);
      setLocalVideo(video);
      let reader = new FileReader();
      reader.onload = function (e) {
        if (reader.result) {
          setFile(Buffer.from(reader.result));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async function checkUploadCost(bytes) {
    if (bytes) {
      const cost = await bundlrInstance.getPrice(bytes);
      setFileCost(utils.formatEther(cost.toString()));
    }
  }

  async function uploadFile() {
    if (!file) return;
    const tags = [{ name: 'Content-Type', value: 'video/mp4' }];
    try {
      let tx = await bundlrInstance.uploader.upload(file, tags);
      setURI(`http://arweave.net/${tx.data.id}`);
    } catch (err) {
      console.log('Error uploading video: ', err);
    }
  }

  async function saveVideo() {
    if (!file || !title || !sports?.[sport] || !description || !gameDate) {
      alert('Missing a required field');
      return;
    }
    const tags = [
      { name: 'Content-Type', value: 'text/plain' },
      { name: 'App-Name', value: APP_NAME },
    ];

    const video = {
      title,
      gameDate,
      sport: sports[sport],
      description,
      URI,
      uploadCost: fileCost,
      uploadCurrency: currency,
      createdAt: new Date(),
      createdBy: bundlrInstance.address,
    };

    try {
      let tx = await bundlrInstance.createTransaction(JSON.stringify(video), {
        tags,
      });
      await tx.sign();
      const { data } = await tx.upload();

      console.log(`http://arweave.net/${data.id}`);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.log('error uploading video with metadata: ', err);
    }
  }

  const reset = () => {
    setFileCost();
    setLocalVideo();
    setFile();
  };

  return (
    <>
      <Head>
        <title>BucNation - Upload</title>
        <meta name='description' content='upload' />
      </Head>
      <div className='pt-16 pb-12 sm:pb-4 lg:pt-12'>
        <Container>
          <h1 className='text-2xl font-bold leading-7 text-slate-900'>
            Upload
          </h1>
        </Container>
        <div className='pt-16 divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100'>
          {!isConnected && (
            <div className='flex items-center justify-center'>
              <ConnectButton />
            </div>
          )}
          {isConnected && (
            <div className='flex items-center justify-center'>
              <button
                className='inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                onClick={() => {
                  setBundlrInstance();
                  reset();
                  return disconnect();
                }}
              >
                Disconnect Wallet and Bundlr
              </button>
            </div>
          )}
          {isConnected && !bundlrInstance && (
            <div className='flex items-center justify-center'>
              <div className='mx-5 my-4'>
                <Select
                  onChange={({ value }) => setCurrency(value)}
                  options={currencyOptions}
                  defaultValue={{ value: currency, label: currency }}
                  classNamePrefix='select'
                  instanceId='currency'
                />
                <p>Currency: {currency}</p>
              </div>
              <div className='flex justify-center px-5 py-3'>
                <button
                  className='inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  onClick={() => initializeBundlr(provider)}
                >
                  Connect Bundlr
                </button>
              </div>
            </div>
          )}
          {isConnected &&
            bundlrInstance &&
            ALLOWED_UPLOADER_ADDRESS === address && (
              <div className='flex flex-col items-center justify-center mt-8'>
                <h3 className='py-4'>
                  💰 Balance {Math.round(balance * 100) / 100}
                </h3>
                <p className='py-4'>Add Video</p>
                <div className='py-4'>
                  <label
                    htmlFor='file'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Add Video
                  </label>
                  <div className='mt-1'>
                    <input
                      ref={fileInputRef}
                      type='file'
                      name='file'
                      id='file'
                      className='block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
                      onChange={onFileChange}
                      accept='.mp4'
                    />
                  </div>
                </div>
                {localVideo && (
                  <>
                    <button
                      onClick={() => {
                        fileInputRef.current.value = '';
                        return reset();
                      }}
                      className='my-4 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      Remove Video
                    </button>
                    <video
                      key={localVideo}
                      width='520'
                      controls
                      className='mb-10'
                    >
                      <source src={localVideo} type='video/mp4' />
                    </video>
                    {fileCost && (
                      <h4 className='py-4'>
                        Cost to upload: {Math.round(fileCost * 1000) / 1000}{' '}
                        MATIC
                      </h4>
                    )}
                    <button
                      className='inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      onClick={uploadFile}
                    >
                      Upload Video
                    </button>
                  </>
                )}
                {URI && (
                  <div>
                    <p className=''>
                      <a href={URI}>{URI}</a>
                    </p>
                    <div className=''>
                      <p className=''>Title</p>
                      <input
                        className=''
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder='Video title'
                      />
                      <p className=''>Game Date</p>
                      <input
                        className=''
                        onChange={(e) => setGameDate(e.target.value)}
                        placeholder='Video game date - August 6, 2022'
                      />
                      <p>Sport</p>
                      <Select
                        onChange={({ value }) => setSport(value)}
                        options={sportOptions}
                        classNamePrefix='select'
                        instanceId='sport'
                      />
                      <p className=''>Description</p>
                      <textarea
                        placeholder='Video description'
                        onChange={(e) => setDescription(e.target.value)}
                        className=''
                      />
                      <button
                        className='inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        onClick={saveVideo}
                      >
                        Save Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          {isConnected &&
            bundlrInstance &&
            ALLOWED_UPLOADER_ADDRESS !== address && (
              <p>Connected wallet is not allowed to upload videos</p>
            )}
        </div>
      </div>
    </>
  );
};
export default Upload;
