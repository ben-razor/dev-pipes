import { useState, useEffect, useCallback, Fragment } from 'react';
import Logo from './images/near-karts-1.png';
import './scss/styles.scss';
import { useToasts } from 'react-toast-notifications';
import BrButton from './js/components/lib/BrButton';
import getText from './data/world/text';

const TOAST_TIMEOUT = 4000;

function App() {

  const { isSignedIn, setIsSignedIn } = useState();

  const { addToast } = useToasts();

  function toast(message, type='info') {
    console.log('toasty ', message);
    addToast(message, { 
      appearance: type,
      autoDismiss: true,
      autoDismissTimeout: TOAST_TIMEOUT
    });
  }

  function doubleToast(message1, message2, type='info') {
    toast( <Fragment><div>{message1}</div><div>{message2}</div></Fragment>, type)
  }

  function signIn() {

  }

  return (
    <div className="br-page">
      <img className="br-header-logo" alt="Dev Pipes Logo" src={Logo} />
      <div className="br-header">
        <div className="br-header-logo-panel">
        </div>
        <div className="br-header-title-panel">
          Dev Pipes
        </div>
        <div className="br-header-controls-panel">
          <div className="br-header-controls">
            <Fragment>
              <BrButton label={ isSignedIn  ? "Sign out" : "Sign in"} id="signIn" className="br-button br-icon-button" onClick={signIn} />
            </Fragment>
          </div>
        </div>
      </div>
      <div className="br-content">
        A project manager manager app with automatic payment flows.
      </div>
    </div>
  );
}

export default App;
