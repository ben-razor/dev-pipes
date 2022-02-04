import { useState, useEffect, useCallback, Fragment } from 'react';
import Logo from './images/dev-pipes-2.png';
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

let networkConfig = {
  contractAddress: '0xb671A76Fe1Ee4E8535d827AdD0b260Ab71A124a9',
  abi: devPipesContract.abi
};

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
  const [ signer, setSigner ] = useState();
  const [ contract, setContract ] = useState();
  const [ contractAddress, setContractAddress ] = useState();
  const [ isSignedIn, setIsSignedIn ] = useState();
  const [ projects, setProjects ] = useState([]);

  const connectEthereum = useCallback(() => {
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      let accounts = await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      console.log('Eth connected', accounts);
      setAccounts(accounts);
      setProvider(provider);
      setSigner(signer);
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

      setIsSignedIn(true);
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

  useEffect(() => {
    if(isSignedIn && validNetwork(networkId)) {
      let contract = new ethers.Contract(networkConfig.contractAddress, networkConfig.abi, signer);
      if(contract) {
        console.log('contract', contract);
        setContract(contract);
        setContractAddress(contract.address);
      }
    }
  }, [isSignedIn, networkId, signer]);

  useEffect(() => {
    let contractChanged = stateCheck.changed('contractAddress1', contractAddress);
    
    if(contractChanged) {
      (async () => {
        let projects = await contract.getProjectsForUser(accounts[0]);
        console.log('PROJECTS', projects);
      })();
    }
  }, [contractAddress, contract]);

  function signIn() {
    if(!isSignedIn) {
      connectEthereum();
    }
    else {
      setAccounts([]);
      setIsSignedIn(false);
    }
  }

  function signInUnstoppable() {

  }

  let todaysDate = new Date().toISOString().substr(0, 16);
  const [ projectEntry, setProjectEntry ] = useState({
    name: '', description: '', uri: '', dueDate: todaysDate, budget: 0
  });

  function projectFormChanged(e, field) {
    let _projectEntry = { ...projectEntry };
    _projectEntry[field] = e.target.value;
    setProjectEntry(_projectEntry);
  }

  function submitProject(e) {
    (async () => {
      let dueDate = Math.floor(Date.now() / 1000);
      let payment = 10n;
      let oneEth = payment**18n;

      let wei = ethers.utils.parseEther(projectEntry.budget);
      console.log('wei', wei);

      let timeStamp = Math.floor(new Date(projectEntry.dueDate).getTime() / 1000);

      try {
        await contract.createProject(
          projectEntry.name, 
          projectEntry.description, 
          projectEntry.uri,
          timeStamp,
          wei.toString()
        );

        toast(getText('text_project_created'))
      }
      catch(e) {
        toast(getText('error_project_created'))
        console.log(e);
      }
    })();

    e.preventDefault();
  }

  function getCreateProjectForm() {
    return <div className="br-feature-panel">

      <h3>Create New Project</h3>
      <form onSubmit={ e => submitProject(e) }>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Name
        </div>
        <div className="br-feature-control">
          <input type="text" minLength="4" required value={projectEntry.name} onChange={e => projectFormChanged(e, 'name') } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Description 
        </div>
        <div className="br-feature-control">
          <input type="text" minLength="8" required value={projectEntry.description} onChange={e => projectFormChanged(e, 'description') } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Media URI
        </div>
        <div className="br-feature-control">
          <input type="text" minLength="20" required value={projectEntry.uri} onChange={e => projectFormChanged(e, 'uri') } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Due Date
        </div>
        <div className="br-feature-control">
          <input type="datetime-local" value={projectEntry.dueDate} onChange={e => projectFormChanged(e, 'dueDate') } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Budget (Eth)
        </div>
        <div className="br-feature-control">
          <input type="number" value={projectEntry.budget} step="0.0001" min="0" onChange={e => projectFormChanged(e, 'budget') } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
        </div>
        <div className="br-feature-control">
          <BrButton type="sumbit" label="Create Project" id="createProject" className="br-button br-icon-button" />
        </div>
      </div>
      </form>
    </div>
  }

  function getProfilePage() {
    let ui;

    ui = <div>
      <h1>Profile Page</h1>
      <div>
        { projects.length ? 
          <div className="br-projects-list">
          </div>  
          :
          <div className="br-info-message">
            You have no projects
          </div>
        }
      </div>
      <div>
        { getCreateProjectForm() }
      </div>
    </div>

    return <div className="br-profile-page">
      {ui}
    </div>
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
        { (isSignedIn && validNetwork(networkId)) ?
          getProfilePage()
          :
          <div className="br-front-page">
            Decentralized project management with automatic payment flows.
            <div className="br-sign-in-panel">
              { !isSignedIn ? 
                <Fragment>
                  <BrButton label={ isSignedIn  ? "Sign out" : "Sign in"} id="signIn" className="br-button br-icon-button" onClick={signIn} />
                  <BrButton label={ isSignedIn  ? "Sign out" : "Sign in with Unstoppable Domains"} id="signIn" className="br-button br-icon-button" onClick={signInUnstoppable} />
                </Fragment>
                :
                !validNetwork(networkId) ?
                  <div className="br-info-message">{getText('text_network_info')}</div>
                  :
                  ''
              }
            </div>
            <img className="br-infographic" alt="Dev Pipes Infographic" src={Infographic} />
          </div>
        }

      </div>
    </div>
  );
}

export default App;
