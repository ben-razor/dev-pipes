import React, { useState, useEffect, useCallback, Fragment } from 'react';
import web3modal from './js/helpers/web3modal';
import Logo from './images/dev-pipes-2.png';
import Infographic from './images/infographic-1.png';
import { useToasts } from 'react-toast-notifications';
import BrButton from './js/components/lib/BrButton';
import './css/_base.css';
import './css/_content.css';
import getText from './data/world/text';
import { ethers } from 'ethers';
import devPipesContract from './data/contract/DevPipes';
import chainConfig, { chainIdToAddress, getAbi, validNetwork } from './data/chainConfig';
import { StateCheck } from './js/helpers/helpers';
import UAuth from '@uauth/js'

const stateCheck = new StateCheck();

const uauth = new UAuth({
  clientID: '2ZatKOp/E4ItUFzBPdwRvD7oh3EhRnCTqIP7rM1MDD8=',
  clientSecret: 'pylTQFwkDRQHw7fyLrVttnY7x6r8S/IEsjEWmImXq8s=',
  redirectUri: 'https://dev-pipes.vercel.app/',
})

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
  const [ networkConfig, setNetworkConfig ] = useState({});
  const [ networkId, setNetworkId ] = useState();
  const [ provider, setProvider ] = useState();
  const [ signer, setSigner ] = useState();
  const [ contract, setContract ] = useState();
  const [ contractAddress, setContractAddress ] = useState();
  const [ isSignedIn, setIsSignedIn ] = useState();
  const [ allProjects, setAllProjects ] = useState([]);
  const [ ownProjects, setOwnProjects ] = useState([]);
  const [ searchedProjects, setSearchedProjects ] = useState([]);
  const [ activeProject, setActiveProject ] = useState({});
  const [ page, setPage ] = useState('projects');
  const [ error, setError ] = useState();
  const [ udInfo, setUDInfo ] = useState({});

  let todaysDate = new Date().toISOString().substr(0, 16);
  const [ projectEntry, setProjectEntry ] = useState({
    name: '', description: '', uri: '', tags: '', dueDate: todaysDate, budget: 0
  });

  const [ searchEntry, setSearchEntry ] = useState({
    tags: ''
  });

  const connectEthereum = useCallback(() => {
    (async () => {
      if(window.ethereum) {
        let accounts;
        const provider = new ethers.providers.Web3Provider(window.ethereum)

        try {
          accounts = await provider.send("eth_requestAccounts", []);

          const signer = provider.getSigner();
          console.log('Eth connected', accounts);
          setAccounts(accounts);
          setProvider(provider);
          setSigner(signer);
          console.log('Pre getNetwork');
          const network = await provider.getNetwork();
          const networkId = parseInt(network.chainId);
          setNetworkId(networkId);
          setNetworkConfig({
            contractAddress: chainIdToAddress('devPipes', networkId),
            abi: getAbi('devPipes')
          })
          console.log('Post getNetwork');

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
        }
        catch(e) {
          console.log(e);
          if(e.code === -32002) {
            doubleToast(getText('error_metamast_accounts_pending'), getText('error_please_check_wallet'));
          }
        }

      }
      else {
        setError('error_no_ethereum');
      }
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
    let networkChanged = stateCheck.changed('networkConfigContract', networkConfig, {});
    console.log('Network', networkChanged, networkConfig, validNetwork(networkId), networkId);
    if(networkChanged && validNetwork(networkId)) {
      try {
        console.log('pre contract');
        let contract = new ethers.Contract(networkConfig.contractAddress, networkConfig.abi, signer);
        console.log('post contract');
        if(contract) {
          console.log('contract', contract);
          setContract(contract);
          setContractAddress(contract.address);
        }
      }
      catch(e) {
        console.log('Error loading contract', e);
      }
    }
  }, [networkId, signer, networkConfig]);

  useEffect(() => {
    let contractChanged = stateCheck.changed('contractAddress1', contractAddress);
    
    if(contractChanged) {
      (async () => {
        try {
          let _projects = await contract.getProjectsForUser(accounts[0]);
          console.log('success projects', _projects);

          setAllProjects(_projects);
        }
        catch(e) {
          console.log('Error getting projects: ', accounts[0], e);
        }
      })();
    }
  }, [contractAddress, networkConfig, contract, accounts]);

  useEffect(() => {
    let _ownProjects = [];
    let _searchedProjects = [];

    if(allProjects.length && accounts.length) {
      for(let proj of allProjects) {
        if(sameAccount(proj.creator, accounts[0])) {
          _ownProjects.push(proj);
        }

        if(proj.status > 0) {
          let include = true;

          let tags = cleanTags(searchEntry.tags);
          console.log(tags);
          if(searchEntry.tags) {
            for(let tag of tags) {
              if(!proj.tags.toLowerCase().includes(tag)) {
                include = false;
              }
            }
          }

          if(include) {
            _searchedProjects.push(proj);
          }
        }
      }
      setOwnProjects(_ownProjects);
      setSearchedProjects(_searchedProjects);
    }
    else {
      setOwnProjects([]);
      setSearchedProjects([]);
    }
  }, [allProjects, accounts, searchEntry]);

  useEffect(() => {
    if(activeProject.id) {
      for(let proj of allProjects) {
        if(proj.id === activeProject.id) {
          setActiveProject(proj);
          break;
        }
      }
    }
  }, [allProjects, activeProject]);

  function cleanTags(tagsStr) {
    let tags = tagsStr.split(',').map(x => x.trim().toLowerCase().replace(/[ ]+/, '-'));
    return tags;
  }

  function signIn() {
    if(!isSignedIn) {
      connectEthereum();
    }
    else {
      setAccounts([]);
      setUDInfo({});
      setIsSignedIn(false);
    }
  }

  function signInUnstoppable() {
    (async () => {
      //const instanceProvider = await web3modal.connect();

      const instanceProvider = await uauth.loginWithPopup()
      console.log(instanceProvider);
      setUDInfo(instanceProvider.idToken);
      let accounts = [instanceProvider.idToken.wallet_address];
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      try {
        if(!accounts.length) {
          accounts = await provider.send("eth_requestAccounts", []);
        }

        const signer = provider.getSigner();
        console.log('Eth connected', accounts);
        setAccounts(accounts);
        setProvider(provider);
        setSigner(signer);
        console.log('Pre getNetwork');
        const network = await provider.getNetwork();
        const networkId = parseInt(network.chainId);
        setNetworkId(networkId);
        setNetworkConfig({
          contractAddress: chainIdToAddress('devPipes', networkId),
          abi: getAbi('devPipes')
        })
        console.log('Post getNetwork');

        window.ethereum.removeAllListeners("chainChanged");
        window.ethereum.removeAllListeners("accountsChanged");

        window.ethereum.on("chainChanged", async(x) => {
          console.log('new net', x);
          setNetworkId(parseInt(x));
        })

        window.ethereum.on("accountsChanged", async(x) => {
          console.log('new accounts ', x);
          setAccounts(x);
        });

        setIsSignedIn(true);
      }
      catch(e) {
        console.log(e);
        if(e.code === -32002) {
          doubleToast(getText('error_metamast_accounts_pending'), getText('error_please_check_wallet'));
        }
      }
     
    })();
  }

  function projectFormChanged(e, field) {
    let _projectEntry = { ...projectEntry };
    _projectEntry[field] = e.target.value;
    setProjectEntry(_projectEntry);
  }

  function submitProject(e, type='create') {
    (async () => {
      console.log('p1');
      let wei = ethers.utils.parseEther(projectEntry.budget.toString());
      console.log('p2');
      console.log('wei', wei);

      let timeStamp = Math.floor(new Date(projectEntry.dueDate).getTime() / 1000);
      let cleanedTags = cleanTags(projectEntry.tags).join(',');
      let tx;
      console.log('Submit proj ' + type);
      
      console.log('p3');
      try {
        if(type === 'create') {
          tx = await contract.createProject(
            projectEntry.name, 
            projectEntry.description, 
            projectEntry.uri,
            cleanedTags,
            timeStamp,
            wei.toString()
          );
        }
        else {
          console.log('Editing start!!');
          tx = await contract.editProject(
            activeProject.id,
            projectEntry.name, 
            projectEntry.description, 
            projectEntry.uri,
            cleanedTags,
            timeStamp,
            wei.toString()
          );
          console.log('Editing!!');
        }

        console.log('p4');
        console.log('tx', tx);

        let _projects = await contract.getProjectsForUser(accounts[0]);
        setAllProjects(_projects);

        provider.once(tx.hash, function(tx) {
          console.log('tx complete ', tx);
          if(type === 'create') {
            toast('text_project_created');
          }
          else {
            toast('text_project_updated');
          }

          (async () => {
            let _projects = await contract.getProjectsForUser(accounts[0]);
            console.log('AP', _projects);
            setAllProjects(_projects);
          })();
        })

        if(type === 'create') {
          toast(getText('text_project_creating'))
        }
        else {
          toast(getText('text_project_updating'))
        }
      }
      catch(e) {
        console.log('EEEE', e);
        if(e.error && e.error.code === -32603) {
          toast(getText(e.error.message.replace('execution reverted: ', '')))
          console.log(e);
        }
        else {
          if(type === 'create') {
            toast(getText('error_project_created'));
          }
          else {
            toast(getText('error_project_updated'));
          }
          console.log(e);
        }
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
          Tags (Comma Separated)
        </div>
        <div className="br-feature-control">
          {project.tags}
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
      <form onSubmit={ e => submitProject(e, type) }>
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
          <input type="text" value={projectEntry.uri} onChange={e => projectFormChanged(e, 'uri') } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Tags (Comma Separated)
        </div>
        <div className="br-feature-control">
          <input type="text" value={projectEntry.tags} onChange={e => projectFormChanged(e, 'tags') } />
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
    for(let proj of allProjects) {
      let projID = proj[0].toString();
      if(projID === id) {
        _activeProject = proj;
      }
    }
    setActiveProject(_activeProject);
  }

  function publishProject(projId) {
    console.log(projId);
    if(projId && contract) {
      (async () => {
        let tx = await contract.publish(projId);

        console.log('tx', tx);

        let _projects = await contract.getProjectsForUser(accounts[0]);
        setAllProjects(_projects);

        provider.once(tx.hash, function(tx) {
          console.log('tx complete ', tx);
          toast('Publish complete');

          (async () => {
            let _projects = await contract.getProjectsForUser(accounts[0]);
            setAllProjects(_projects);
          })();
        })

        toast(getText('text_project_updating'))
      })();
    }
  }

  function getProjectsList(projects) {
    let rows = [];

    for(let proj of projects) {
      console.log(proj);
      let projID = proj.id.toString();
      rows.push(<div className="br-project-row" key={projID}>
        <div className="br-project-heading">
          <div className="br-project-name">{proj.name}</div>
        </div>
        <div className="br-project-details">
          <div className="br-project-details-left">
            <div className="br-project-description">{proj.description}</div>
            <div className="br-project-description">{proj.tags}</div>
            <div className="br-project-description">Due: {formatDate(dateFromBigNumber(proj.dueDate))}</div>
            <div className="br-project-description">Budget: {ethers.utils.formatEther(proj.budget)}</div>
          </div>
          <div className="br-project-details-right">
            <BrButton type="sumbit" label="Select" id={'selectProject' + projID} key={'submit' + projID}
                      className="br-button br-icon-button" onClick={e => selectProject(projID)}/>
            <div className="br-separator"></div>
            {proj.status === 0 ? 
              <BrButton type="sumbit" label="Publish" id={'publishProject' + projID} key={'publish' + projID}
                        className="br-button br-icon-button" onClick={e => publishProject(projID)}/>
              :
              <div className="">Published</div>
            }
          </div>
        </div>
      </div>);
    }
    return rows;
  }

  function searchFormChanged(e, field) {
    let _searchEntry = { ...searchEntry };
    _searchEntry[field] = e.target.value;
    setSearchEntry(_searchEntry);
  }

  function getSearchForm() {
    return <div className="br-feature-panel">
      <h3>Search Projects</h3>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Tags 
        </div>
        <div className="br-feature-control">
          <input type="text" minLength="4" required value={searchEntry.tags} onChange={e => searchFormChanged(e, 'tags') } />
        </div>
      </div>
    </div>
  }

  function getSearchPage(projects) {
    let ui;

    ui = <div>
      <div className="br-page-panels">
        <div className="br-page-panel">
          { getSearchForm() }
          <div> 
            { projects.length ? 
              <Fragment>
                <div className="br-projects-list">
                  { getProjectsList(projects) }
                </div>  
              </Fragment>
              :
              getText('text_no_project_results')
          }
        </div>
      </div>
    </div>
  </div>

  return <div className="br-profile-page">
    {ui}
  </div>
}

function getTasksPage() {
  let ui;

  ui = <div className="br-page-panel">
    You are not assigned to any tasks.
    <br />
    <br />
    Use the Search panel to view projects to apply for.
  </div>

    return <div className="br-tasks-page">
      {ui}
    </div>
  }

  function getProjectsPage(projects) {
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
              getText('text_project_none')
            }
          </div>
        </div>
        <div className="br-page-panel">
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
      _projectEntry.tags = activeProject.tags;

      _projectEntry.dueDate = dateFromBigNumber(activeProject.dueDate).toISOString().substr(0, 16);
      _projectEntry.budget = ethers.utils.formatEther(activeProject.budget.toString());
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
    let mainPageUI;
    if(page === 'projects') {
      mainPageUI = getProjectsPage(ownProjects);
    }
    else if(page === 'tasks') {
      mainPageUI = getTasksPage();
    }
    else if(page === 'search') {
      mainPageUI = getSearchPage(searchedProjects);
    }

    return <div className="br-pages">
      { activeProject?.id ?
        getActiveProjectPage(activeProject)
        :
        <Fragment>
          {getPageHeadings()}
          {mainPageUI}
        </Fragment>
      }
    </div>
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
              <div className="br-header-name">{ udInfo.sub ? udInfo.sub : accounts[0]?.substr(0, 28) + '…'}</div>
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
            {error ? <div className="br-info-message">{ getText(error) }</div> : ''}
            <div className="br-sign-in-panel">
              { !isSignedIn ? 
                <Fragment>
                  <button id="signInUnstoppable" className="button-unstoppable" onClick={e => signInUnstoppable() }></button>
                  <div className="br-separator"></div>
                  <BrButton label={ isSignedIn  ? "Sign out" : "Sign in with MetaMask"} id="signIn" className="br-button br-icon-button" onClick={signIn} />
                </Fragment>
                :
                (
                  !validNetwork(networkId) ?
                    <div className="br-info-message">{getText('text_network_info')}</div>
                    :
                    ''
                )
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
