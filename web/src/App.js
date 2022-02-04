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
  const [ activeProject, setActiveProject ] = useState({});
  const [ page, setPage ] = useState('projects');

  const connectEthereum = useCallback(() => {
    (async () => {
      console.log('conn eth')
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
    connectEthereum();
  }, [connectEthereum]);

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
        let _projects = await contract.getProjectsForUser(accounts[0]);
        setProjects(_projects);
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
        let tx = await contract.createProject(
          projectEntry.name, 
          projectEntry.description, 
          projectEntry.uri,
          timeStamp,
          wei.toString()
        );

        console.log('tx', tx);

        let _projects = await contract.getProjectsForUser(accounts[0]);
        setProjects(_projects);

        provider.once(tx.hash, function(tx) {
          console.log('tx complete ', tx);
          toast('tx complete ' + JSON.stringify(tx));

          (async () => {
            let _projects = await contract.getProjectsForUser(accounts[0]);
            setProjects(_projects);
          })();
        })

        toast(getText('text_project_creating'))
      }
      catch(e) {
        toast(getText('error_project_created'))
        console.log(e);
      }
    })();

    e.preventDefault();
  }

  function getProjectTable(project) {
    return <div className="br-feature-panel">

      <div className="br-feature-row">
        <div className="br-feature-label">
          Name
        </div>
        <div className="br-feature-control">
          {project.name}
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Description 
        </div>
        <div className="br-feature-control">
          {project.description}
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Media URI
        </div>
        <div className="br-feature-control">
          {project.uri}
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Due Date
        </div>
        <div className="br-feature-control">
          {formatDate(dateFromBigNumber(project.dueDate))} 
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Budget (Eth)
        </div>
        <div className="br-feature-control">
          {ethers.utils.formatEther(project.payment.toString())}
        </div>
      </div>
    </div>
  }

  function dateFromBigNumber(dateBN) {
    return new Date(parseInt(dateBN.toString()) * 1000);
  }

  function formatDate(date) {
    return date.toISOString().substr(0, 16).replace('T', ' ');
  }

  function getCreateProjectForm(type='create') {
    return <div className="br-feature-panel">
      <h3>{ type === 'create' ? 'Create New Project' : 'Edit Project' }</h3>
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
          <BrButton type="sumbit" label={ type === 'create' ? "Create Project" : "Submit" } id="createProject" 
                    className="br-button br-icon-button" />
        </div>
      </div>
      </form>
    </div>
  }

  function selectProject(id) {
    let _activeProject = {};
    for(let proj of projects) {
      let projID = proj[0].toString();
      if(projID === id) {
        _activeProject = proj;
      }
    }
    setActiveProject(_activeProject);
  }

  function getProjectsList(projects) {
    let rows = [];

    for(let proj of projects) {
      let projID = proj.id.toString();
      rows.push(<div className="br-project-row" key={projID}>
        <div className="br-project-heading">
          <div className="br-project-name">{proj.name}</div>
        </div>
        <div className="br-project-details">
          <div className="br-project-details-left">
            <div className="br-project-description">{proj.description}</div>
          </div>
          <div className="br-project-details-right">
            <BrButton type="sumbit" label="Select" id={'selectProject' + projID} key={'submit' + projID}
                      className="br-button br-icon-button" onClick={e => selectProject(projID)}/>
          </div>
        </div>
      </div>);
    }
    return rows;
  }

  function getProjectsPage() {
    let ui;

    ui = <div>
      <div className="br-page-panels">
        <div className="br-page-panel">
          <div> 
            <h3>Your Projects</h3>
            { projects.length ? 
              <div className="br-projects-list">
                { getProjectsList(projects) }
              </div>  
              :
              <div className="br-info-message">
                {getText('text_project_none')}
              </div>
            }
          </div>
        </div>
        <div className="br-profile-panel">
          { getCreateProjectForm() }
        </div>
      </div>
    </div>

    return <div className="br-profile-page">
      {ui}
    </div>
  }

  function sameAccount(acc1, acc2) {
    return acc1.toLowerCase() === acc2.toLowerCase();
  }

  useEffect(() => {
    if(activeProject.id) {
      let _projectEntry = { ...projectEntry };
      _projectEntry.name = activeProject.name;
      _projectEntry.description = activeProject.description;
      _projectEntry.uri = activeProject.uri;

      _projectEntry.dueDate = dateFromBigNumber(activeProject.dueDate).toISOString().substr(0, 16);
      _projectEntry.budget = ethers.utils.formatEther(activeProject.payment.toString());
      setProjectEntry(_projectEntry);
    }
  }, [activeProject]);

  function getActiveProjectPage(activeProject) {
    console.log('CA', activeProject.creator, accounts[0]);
    return <div className="br-active-project-page">
      <div className="br-back-button-holder">
        <BrButton label={<i className="fa fa-arrow-left"></i>} id="goBackActiveProject" 
                  className="br-button br-icon-button" 
                  onClick={e => setActiveProject({})} />
      </div>
      <h1>{ activeProject.name }</h1>
      <div className="br-page-panels">
        <div className="br-page-panel">
          <div className="br-active-project-page">
            { 
              sameAccount(activeProject.creator, accounts[0]) ?
              getCreateProjectForm('edit')
              :
              getProjectTable(activeProject) 
            }
          </div>
        </div>
      </div>

    </div>
  }

  function getActiveTabClass(id) {
    let activeClass = (id === page ? ' br-page-heading-active ' : '');
    return activeClass;
  }

  function getPageTab(id, text) {
    let tabClass = "br-page-heading";

    return <div className={tabClass + getActiveTabClass(id)} onClick={e => setPage(id)}>
      {text}
    </div>
  }

  function getPageHeadings() {
    return <div className="br-page-headings">
      {getPageTab('projects', 'Your Projects')}
      {getPageTab('tasks', 'Your Tasks')}
      {getPageTab('search', 'Search')}
    </div>
  }

  function getMainPages() {
    return <div class="br-pages">
      { activeProject?.id ?
        getActiveProjectPage(activeProject)
        :
        <Fragment>
          {getPageHeadings()}
          {getProjectsPage()}
        </Fragment>
      }
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
          getMainPages()
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
