import { useState, useContext } from 'react';
import { AppContext } from '../context';
import { APP_NAME } from '../utils';
import { useRouter } from 'next/router';
import { utils } from 'ethers';
import Select from 'react-select';

const supportedCurrencies = {
  matic: 'matic',
  ethereum: 'ethereum',
  avalanche: 'avalanche',
  bnb: 'bnb',
  arbitrum: 'arbitrum',
};

const currencyOptions = Object.keys(supportedCurrencies).map((v) => {
  return {
    value: v,
    label: v,
  };
});

const Upload = () => {
  const { balance, bundlrInstance, initializeBundlr, currency, setCurrency } =
    useContext(AppContext);
  const [file, setFile] = useState();
  const [localVideo, setLocalVideo] = useState();
  const [title, setTitle] = useState('');
  const [fileCost, setFileCost] = useState();
  const [description, setDescription] = useState('');
  const router = useRouter();

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
    if (!file || !title || !description) return;
    const tags = [
      { name: 'Content-Type', value: 'text/plain' },
      { name: 'App-Name', value: APP_NAME },
    ];

    const video = {
      title,
      description,
      URI,
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

  if (!bundlrInstance) {
    return (
      <div className='pt-24'>
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
          <button className='' onClick={initializeBundlr}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center pt-24'>
      <h3 className=''>💰 Balance {Math.round(balance * 100) / 100}</h3>
      <div className=''>
        <p className=''>Add Video</p>
        <div className=''>
          <input type='file' onChange={onFileChange} />
        </div>
        {localVideo && (
          <video key={localVideo} width='520' controls className='mb-10'>
            <source src={localVideo} type='video/mp4' />
          </video>
        )}
        {fileCost && (
          <h4>Cost to upload: {Math.round(fileCost * 1000) / 1000} MATIC</h4>
        )}
        <button className='' onClick={uploadFile}>
          Upload Video
        </button>
        {URI && (
          <div>
            <p className=''>
              <a href={URI}>{URI}</a>
            </p>
            <div className=''>
              <p className={labelStyle}>Title</p>
              <input
                className=''
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Video title'
              />
              <p className=''>Description</p>
              <textarea
                placeholder='Video description'
                onChange={(e) => setDescription(e.target.value)}
                className={textAreaStyle}
              />
              <button className='' onClick={saveVideo}>
                Save Video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Upload;
