import { useState, useEffect, useCallback, Fragment } from 'react';
import Logo from './images/dev-pipes-1.png';
import Infographic from './images/infographic-1.png';
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
      <div className="br-header">
        <div className="br-header-logo-panel">
        </div>
        <div className="br-header-title-panel">
          <img className="br-header-logo" alt="Dev Pipes Logo" src={Logo} />
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
        <div className="br-front-page">
          Decentralized project management with automatic payment flows.
          <img className="br-infographic" alt="Dev Pipes Infographic" src={Infographic} />
        </div>
      </div>
    </div>
  );
}

export default App;
