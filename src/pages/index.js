import { useState, useEffect } from 'react';
import Head from 'next/head';
import { arweave, query, getVideoMeta } from '../utils';

import Container from '@/components/Container';

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState();

  // when app loads, fetch videos
  useEffect(() => {
    getPostInfo();
  }, []);

  // fetch data from Arweave
  // map over data and fetch metadata for each video then save to local state
  async function getPostInfo(topicFilter = null, depth = 0) {
    try {
      const results = await arweave.api.post('/graphql', query).catch((err) => {
        console.error('GraphQL query failed');
        throw new Error(err);
      });
      const edges = results.data.data.transactions.edges;
      const videos = await Promise.all(
        edges.map(async (edge) => await getVideoMeta(edge.node))
      );
      let sorted = videos.sort(
        (a, b) =>
          new Date(b.request.data.createdAt) -
          new Date(a.request.data.createdAt)
      );
      sorted = sorted.map((s) => s.request.data);
      setVideos(sorted);
      setVideosLoading(false);
    } catch (err) {
      await wait(2 ** depth * 10);
      getPostInfo(topicFilter, depth + 1);
      console.log('error: ', err);
    }
  }

  return (
    <>
      <Head>
        <title>BucNation - Iconic East Tennessee State Highlight Videos</title>
        <meta
          name='description'
          content='Iconic East Tennessee State Highlight Videos'
        />
      </Head>
      <div className='pt-16 pb-12 sm:pb-4 lg:pt-12'>
        <Container>
          <h1 className='text-2xl font-bold leading-7 text-slate-900'>
            Highlight Videos
          </h1>
        </Container>
        <div className='divide-y divide-slate-100 sm:mt-4 lg:mt-8 lg:border-t lg:border-slate-100'>
          {videos.map((video) => (
            <div
              className='flex flex-col items-center justify-center py-12'
              key={video.URI}
            >
              <video
                key={video.URI}
                width='720px'
                height='405'
                controls
                className=''
              >
                <source src={video.URI} type='video/mp4' />
              </video>
              <div className=''>
                <h3 className=''>{video.title}</h3>
              </div>
              <p>{video.sport}</p>
              <p className=''>{video.description}</p>
            </div>
          ))}
          {!videosLoading && !videosError && !videos?.length && (
            <div className='py-12 text-center'>
              <p>No videos have been uploaded!</p>
            </div>
          )}
          {!videosLoading && videosError && !videos?.length && (
            <div className='py-12 text-center'>
              <p>There was an error fetching the videos</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
