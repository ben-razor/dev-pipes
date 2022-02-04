import { useState, useEffect, useCallback, Fragment } from 'react';
import Logo from './images/dev-pipes-1.png';
import Infographic from './images/infographic-1.png';
import './scss/styles.scss';
import { useToasts } from 'react-toast-notifications';
import BrButton from './js/components/lib/BrButton';
import getText from './data/world/text';
import { ethers } from 'ethers';
import devPipesContract from './data/contract/DevPipes';
import { StateCheck } from './js/helpers/helpers';
const stateCheck = new StateCheck();

const TOAST_TIMEOUT = 4000;

function App() {


  const { addToast } = useToasts();

  const toast = useCallback((message, type='info') => {
    console.log('toasty ', message);
    addToast(message, { 
      appearance: type,
      autoDismiss: true,
      autoDismissTimeout: TOAST_TIMEOUT
    });
  }, [addToast]);

  const doubleToast = useCallback((message1, message2, type='info') => {
    toast( <Fragment><div>{message1}</div><div>{message2}</div></Fragment>, type)
  }, [toast]);

  const [ accounts, setAccounts ] = useState([]);
  const [ network, setNetwork ] = useState({});
  const [ networkId, setNetworkId ] = useState();
  const [ provider, setProvider ] = useState();
  const [ isSignedIn, setIsSignedIn ] = useState();

  const connectEthereum = useCallback(() => {
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      let accounts = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      console.log('Eth connected', accounts);
      setAccounts(accounts);
      setProvider(provider);
      const network = await provider.getNetwork();
      setNetworkId(parseInt(network.chainId));

      window.ethereum.removeAllListeners("chainChanged");
      window.ethereum.removeAllListeners("accountsChanged");

      window.ethereum.on("chainChanged", async(x) => {
        console.log('new net', x);
        setNetworkId(parseInt(x));
      });

      window.ethereum.on("accountsChanged", async(x) => {
        console.log('new accounts ', x);
        setAccounts(x);
      });
    })();
  }, []);

  useEffect(() => {
    let networkChanged = stateCheck.changed('netChanged1', networkId);
    console.log('nid', networkId, networkChanged);

    if(networkChanged) {
      if(networkId === 1) {
        console.log('Network Ethereum');
      }
      else if(networkId === 3) {
        console.log('Network Ropsten');
      }
      else if(networkId === 0x89) {
        console.log('Network Matic');
      }
      else if(networkId === 0x13881) {
        console.log('Network Matic Mumbai');
      }

      connectEthereum();
    }
  }, [networkId, connectEthereum]);

  useEffect(() => {
    let networkChanged = stateCheck.changed('netChanged2', networkId);
    console.log('nid', networkId, networkChanged);
    if(networkChanged && networkId && !validNetwork(networkId)) {
      setIsSignedIn(false);
      doubleToast(getText('error_invalid_network'), getText('text_network_info'), 'warning');
    }
  }, [networkId, doubleToast]);

  useEffect(() => {
    if(provider) {
      (async () => {
        try {
          console.log('bal ', await provider.getBalance(accounts[0]));
        }
        catch(e) {
          console.log('Cannot get balance');
        }
      })();
    }
  }, [accounts, provider, networkId]);

  function signIn() {
    connectEthereum();
  }

  function signInUnstoppable() {

  }

  function getProfilePage() {

  }

  function validNetwork(networkId) {
    return parseInt(networkId) === 3;
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
          { isSignedIn ?
            <Fragment>
              <BrButton label={ isSignedIn  ? "Sign out" : "Sign in"} id="signIn" className="br-button br-icon-button" onClick={signIn} />
            </Fragment>
            :
            ''
          }
        </div>
      </div>
      <div className="br-content">
        { isSignedIn ?
          getProfilePage()
          :
          <div className="br-front-page">
            Decentralized project management with automatic payment flows.
            <div className="br-sign-in-panel">
              <Fragment>
                <BrButton label={ isSignedIn  ? "Sign out" : "Sign in"} id="signIn" className="br-button br-icon-button" onClick={signIn} />
              </Fragment>
              <Fragment>
                <BrButton label={ isSignedIn  ? "Sign out" : "Sign in with Unstoppable Domains"} id="signIn" className="br-button br-icon-button" onClick={signInUnstoppable} />
              </Fragment>
            </div>
            <img className="br-infographic" alt="Dev Pipes Infographic" src={Infographic} />
          </div>
        }

      </div>
    </div>
  );
}

export default App;
