import React from 'react';

const Footer = () => {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between py-6 w-full px-4 md:px-6 border-t bg-gray-900 text-white">
      <p>
        
        <a href="https://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" className="inline-flex items-center">
         CC BY-SA 4.0
          <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt="" className="h-5 ml-1" />
          <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt="" className="h-5 ml-1" />
          <img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1" alt="" className="h-5 ml-1" />
        </a>
      </p>
      <nav className="flex gap-4 sm:gap-6">
        <a className="text-xs hover:underline underline-offset-4 text-white" href="https://amithv.xyz">by amithv.xyz</a>
        <a className="text-xs hover:underline underline-offset-4 text-white" href="https://github.com/amith-vp/Kochi-metro-timings">Github</a>
        <a className="text-xs hover:underline underline-offset-4 text-white" href="https://buymeacoffee.com/amithv">Buy Me a Coffee</a>
      </nav>
    </footer>
  );
};

export default Footer;
