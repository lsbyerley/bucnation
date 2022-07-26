import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { arweave, query, getVideoMeta } from '@/utils';

import Container from '@/components/Container';
import { FormattedDate } from '@/components/FormattedDate';
import clsx from 'clsx';

// basic exponential backoff in case of gateway timeout / error
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
      setVideosLoading(true);
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
      sorted = sorted.map((s) => {
        return {
          id: s.txid,
          ...s.request.data,
        };
      });
      setVideos(sorted);
      setVideosLoading(false);
    } catch (err) {
      // await wait(2 ** depth * 10);
      // getPostInfo(topicFilter, depth + 1);
      setVideosLoading(false);
      setVideosError(err);
      console.log('error: ', err);
    }
  }

  const VideoEntry = ({ video }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    let date = new Date(video.gameDate);

    /* let audioPlayerData = useMemo(
      () => ({
        title: video.title,
        audio: {
          src: video.audio.src,
          type: video.audio.type,
        },
        link: `/${video.id}`,
      }),
      [video]
    );
    let player = useAudioPlayer(audioPlayerData); */

    return (
      <article
        aria-labelledby={`video-${video.id}-title`}
        className='py-10 sm:py-12'
      >
        <Container>
          <div className='flex flex-col items-start'>
            <h2
              id={`video-${video.id}-title`}
              className='mt-2 text-lg font-bold text-slate-900'
            >
              <Link href={`/${video.id}`}>{video.title}</Link>
            </h2>
            <FormattedDate
              date={date}
              className='order-first font-mono text-sm leading-7 text-slate-500'
            />
            <video
              key={video.URI}
              width='720px'
              height='405'
              controls
              className=''
            >
              <source src={video.URI} type='video/mp4' />
            </video>
            <p
              className={clsx(
                'mt-1 text-base leading-7 text-slate-700',
                !isExpanded && 'line-clamp-4'
              )}
            >
              {video.description}
            </p>
            <div className='flex items-center gap-4 mt-4'>
              {/*<button
                type='button'
                onClick={() => player.toggle()}
                className='flex items-center text-sm font-bold leading-6 text-blue-500 hover:text-blue-700 active:text-blue-900'
                aria-label={`${player.playing ? 'Pause' : 'Play'} video ${
                  video.title
                }`}
              >
                <PlayPauseIcon
                  playing={player.playing}
                  className='h-2.5 w-2.5 fill-current'
                />
                <span className='ml-3' aria-hidden='true'>
                  Listen
                </span>
              </button>*/}
              <span
                aria-hidden='true'
                className='text-sm font-bold text-slate-400'
              >
                /
              </span>
              <button
                type='button'
                className='flex items-center text-sm font-bold leading-6 text-blue-500 hover:text-blue-700 active:text-blue-900'
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={`Show more info for video ${video.title}`}
              >
                {isExpanded ? 'Read less' : 'Read More'}
              </button>
            </div>
          </div>
        </Container>
      </article>
    );
  };

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
            <VideoEntry key={video.id} video={video} />
          ))}
          {videosLoading && !videosError && (
            <div className='py-12 text-center'>
              <p>Loading videos..</p>
            </div>
          )}
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
