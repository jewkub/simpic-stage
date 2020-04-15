import React from 'react'

import 'bootstrap/dist/css/bootstrap.min.css';
// import 'any-other-css-you-want.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

// https://github.com/zeit/next.js/issues/10059#issuecomment-573461531