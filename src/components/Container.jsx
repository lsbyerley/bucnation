import clsx from 'clsx';

const Container = ({ className, children, ...props }) => {
  return (
    <div className={clsx('lg:px-8', className)} {...props}>
      <div className='lg:max-w-4xl'>
        <div className='px-4 mx-auto sm:px-6 md:max-w-2xl md:px-4 lg:px-0'>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Container;
