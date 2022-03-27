import React, { useState, useEffect, useCallback, Fragment } from 'react';
import web3modal from './js/helpers/web3modal';
import Logo from './images/dev-pipes-2.png';
import Infographic from './images/infographic-1.png';
import { toast as toasty } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BrButton from './js/components/lib/BrButton';
import BrModal from './js/components/lib/BrModal.js';
import './css/_base.css';
import './css/_content.css';
import getText from './data/text';
import { ethers } from 'ethers';
import devPipesContract from './data/contract/DevPipes';
import chainConfig, { chainIdToAddress, getAbi, validNetwork } from './data/chainConfig';
import env from './data/udConfig';
import { StateCheck } from './js/helpers/helpers';
import UAuth from '@uauth/js';
import Modal from 'react-modal';
import { display } from '@uauth/web3modal';
import {Biconomy} from "@biconomy/mexa";

const stateCheck = new StateCheck();

const uauth = new UAuth({
  clientID: env.UD_CLIENT_ID,
  clientSecret: env.UD_CLIENT_SECRET,
  redirectUri: env.UD_REDIRECT_URI,
})

const TOAST_TIMEOUT = 4000;

function App() {

  function toast(message, type='info') {
    toasty[type](message, { 
      position: "top-right",
      autoClose: TOAST_TIMEOUT,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light'
    });
  }

  const tripleToast = useCallback((message1, message2, message3, type='info') => {
    toast( <Fragment><div>{message1}</div><div>{message2}</div><div>{message3}</div></Fragment>, type)
  }, [toast]);

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
  const [ subProjects, setSubProjects ] = useState([]);
  const [ page, setPage ] = useState('projects');
  const [ error, setError ] = useState();
  const [ udInfo, setUDInfo ] = useState({});
  const [ modalState, setModalState ] = useState({ open: false, title: '', content: ''}); 
  const [ nameSub, setNameSub ] = useState('');
  const [ subTree, setSubTree ] = useState();

  let todaysDate = new Date().toISOString().slice(0, 16);
  const [ projectEntry, setProjectEntry ] = useState({
    name: '', description: '', uri: '', tags: '', dueDate: todaysDate, budget: 0
  });

  const [ subProjectEntry, setSubProjectEntry ] = useState({
    name: '', description: '', uri: '', tags: '', dueDate: todaysDate, budget: 0
  });

  const [ searchEntry, setSearchEntry ] = useState({
    tags: ''
  });

  const connectEthereum = useCallback(() => {
    (async () => {
      if(window.ethereum) {
        let accounts;

        try {
          let provider = new ethers.providers.Web3Provider(window.ethereum)
          const biconomy_api_key = chainConfig.contracts.devPipes.biconomy_api_key.rop;
          console.log('BI API KEY', biconomy_api_key);
          const biconomy = new Biconomy(provider, { apiKey: biconomy_api_key, debug: true} );
          provider = new ethers.providers.Web3Provider(biconomy);
          accounts = await provider.send("eth_requestAccounts", []);

          const signer = provider.getSigner();
          console.log('Eth connected', accounts);
          setAccounts(accounts);
          setProvider(provider);
          setSigner(signer);
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
            doubleToast(getText('error_metamask_accounts_pending'), getText('error_please_check_wallet'));
          }
          else {
            toast('error_wallet_connect');
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

      if(!networkId) {
        tripleToast(
          getText('error_network_unavailable'), 
          getText('error_please_check_wallet'),
          getText('text_then_reload')
        );
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
          await provider.getBalance(accounts[0]);
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
        let contract = new ethers.Contract(networkConfig.contractAddress, networkConfig.abi, signer);
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
          let _projects = await contract.getAllProjects();
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
        console.log('PROJ', proj);
        if(sameAccount(proj.creator, accounts[0])) {
          if(proj.parentId.toString() === '0') {
            _ownProjects.push(proj);
          }
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
            if(proj.parentId.toString() === '0') {
              _searchedProjects.push(proj);
            }
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
      let activeProjId = activeProject.id.toString();
      let activeProjRootId = activeProject.rootId.toString();
      if(activeProjRootId === '0') {
        activeProjRootId = activeProjId;
      }

      let _subProjects = [];
      let allChildren = [];

      for(let proj of allProjects) {
        let parentId = proj.parentId.toString();
        let rootId = proj.rootId.toString();

        if(proj.id === activeProject.id) {
          setActiveProject(proj);
        }
        else if(parentId !== "0" && parentId === activeProjId) {
          _subProjects.push(proj);
        }
        if(rootId === activeProjRootId || proj.id.toString() === activeProjRootId) {
          let _proj = {...proj};
          _proj.idStr = proj.id.toString();
          _proj.parentIdStr = proj.parentId.toString();
          allChildren.push(_proj);
        }
      }

      console.log(allChildren);
      let subTree = createSubTree(allChildren, 'idStr', 'parentIdStr', 0);
      setSubTree(subTree);

      setSubProjects(_subProjects);
    }
  }, [allProjects, activeProject]);

  function displayTree(tree, level=0, treeUI=[]) {
    treeUI.push(<div key={tree.idStr} className={"br-project-tree-item"} 
                     style={ { marginLeft: `${level/2}em`}} onClick={e => selectProject(tree.idStr)}>
      {tree.name}
    </div>);

    for(let child of tree.Children) {
      treeUI.push(displayTree(child, level + 1, []));
    }
    return treeUI;
  }

  function createSubTree(treeData, key, parentKey, rootIndex=-1)
  {
      var keys = [];
      treeData.map(function(x){
          x.Children = [];
          keys.push(x[key]);
      });
      var roots = treeData.filter(function(x){return keys.indexOf(x[parentKey])==-1});
      var nodes = [];
      roots.map(function(x){nodes.push(x)});
      while(nodes.length > 0)
      {

          var node = nodes.pop();
          var children =  treeData.filter(function(x){return x[parentKey] == node[key]});
          children.map(function(x){
              node.Children.push(x);
              nodes.push(x)
          });
      }
      if (roots.length==1) return roots[0];
      return roots;
  }

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
        const network = await provider.getNetwork();
        const networkId = parseInt(network.chainId);
        setNetworkId(networkId);
        setNetworkConfig({
          contractAddress: chainIdToAddress('devPipes', networkId),
          abi: getAbi('devPipes')
        })

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

  function projectFormChanged(e, field, type) {
    let entryData = projectEntry;
    if(type === 'subtask') {
      entryData = subProjectEntry;
    }

    let _projectEntry = { ...entryData};
    _projectEntry[field] = e.target.value;
    if(type !== 'subtask') {
      setProjectEntry({..._projectEntry});
    }
    else {
      setSubProjectEntry({..._projectEntry});
    }
  }

  function submitProject(e, type='create') {
    (async () => {
      let entryData = projectEntry;
      if(type === 'subtask') {
        entryData = subProjectEntry
      }
      let wei = ethers.utils.parseEther(entryData.budget.toString());
      console.log('wei', wei);

      let timeStamp = Math.floor(new Date(entryData.dueDate).getTime() / 1000);
      let cleanedTags = cleanTags(entryData.tags).join(',');
      let tx;
      
      try {
        if(type === 'create') {
          tx = await contract.createProject(
            entryData.name, 
            entryData.description, 
            entryData.uri,
            cleanedTags,
            timeStamp,
            wei.toString()
          );
        }
        else if(type === 'edit') {
          console.log('Editing start!!');
          tx = await contract.editProject(
            activeProject.id,
            entryData.name, 
            entryData.description, 
            entryData.uri,
            cleanedTags,
            timeStamp,
            wei.toString()
          );
          console.log('Editing!!');
        }
        else if(type === 'subtask') {
          console.log('Create subproject start!!');
          tx = await contract.createSubProject(
            activeProject.id,
            entryData.name, 
            entryData.description, 
            entryData.uri,
            cleanedTags,
            timeStamp,
            wei.toString()
          );
          console.log('Editing!!');
          closeModal();
        }

        console.log('p4');
        console.log('tx', tx);

        let _projects = await contract.getAllProjects();
        setAllProjects(_projects);

        provider.once(tx.hash, function(tx) {
          console.log('tx complete ', tx);
          if(type === 'create') {
            toast(getText('text_project_created'));
          }
          else {
            toast(getText('text_project_updated'));
          }

          (async () => {
            let _projects = await contract.getAllProjects();
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
        if(e.error && e.error.code === -32603) {
          toast(getText(e.error.message.replace('execution reverted: ', '')))
          console.log(e);
        }
        else if(e.code === 4001) {
          toast(getText('text_transaction_cancelled'));
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
          {ethers.utils.formatEther(project.budget.toString())}
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

  function createSubprojectStart(e, projectId) {
    openModal();
  }

  function getCreateProjectForm(type='create') {
    let entryData = projectEntry;
    if(type === 'subtask') {
      entryData = subProjectEntry;
    }

    return <div className="br-feature-panel">
      {
        type !== 'subtask' ?
          <h3>{ type === 'create' ? 'Create New Project' : 'Edit Project' }</h3>
          :
          ''
      }
      <form onSubmit={ e => submitProject(e, type) }>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Name
        </div>
        <div className="br-feature-control">
          <input type="text" minLength="4" required value={entryData.name} onChange={e => projectFormChanged(e, 'name', type) } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Description 
        </div>
        <div className="br-feature-control">
          <input type="text" minLength="8" required value={entryData.description} onChange={e => projectFormChanged(e, 'description', type) } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Media URI
        </div>
        <div className="br-feature-control">
          <input type="text" value={entryData.uri} onChange={e => projectFormChanged(e, 'uri', type) } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Tags (Comma Separated)
        </div>
        <div className="br-feature-control">
          <input type="text" value={entryData.tags} onChange={e => projectFormChanged(e, 'tags', type) } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Due Date
        </div>
        <div className="br-feature-control">
          <input type="datetime-local" value={entryData.dueDate} onChange={e => projectFormChanged(e, 'dueDate', type) } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
          Budget (Eth)
        </div>
        <div className="br-feature-control">
          <input type="number" value={entryData.budget} step="0.0001" min="0" onChange={e => projectFormChanged(e, 'budget', type) } />
        </div>
      </div>
      <div className="br-feature-row">
        <div className="br-feature-label">
        </div>
        <div className="br-feature-control">
          <BrButton type="sumbit" label={ type === 'create' ? "Create Project" : "Submit" } id="createProject" 
                    className="br-button br-icon-button" />
          { type === 'edit' ?
            <BrButton type="button" label="Create Subproject" id="createSubproject" className="br-button br-icon-button" 
                      onClick={ e => createSubprojectStart(e, activeProject.id) } />
            :
            ''
          }
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
    if(projId && contract) {
      (async () => {
        let tx = await contract.publish(projId);

        console.log('tx', tx);

        let _projects = await contract.getAllProjects();
        setAllProjects(_projects);

        provider.once(tx.hash, function(tx) {
          console.log('tx complete ', tx);
          toast(getText('text_project_published'));

          (async () => {
            let _projects = await contract.getAllProjects();
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
      rows.push(getProjectDetailsPanel(proj));
    }
    return rows;
  }

  function getProjectDetailsPanel(proj) {
    let projID = proj.id.toString();
    let ownProject = sameAccount(proj.creator, accounts[0]);

    return <div className="br-project-row" key={projID}>
      <div className="br-project-heading">
        <div className="br-project-name">{proj.name}</div>
      </div>
      <div className="br-project-details">
        <div className="br-project-details-left">
          <div className="br-project-description">{proj.description}</div>
          <div className="br-project-description">Tags: {proj.tags}</div>
          <div className="br-project-description">Due: {formatDate(dateFromBigNumber(proj.dueDate))}</div>
          <div className="br-project-description">Budget: {ethers.utils.formatEther(proj.budget)}</div>
        </div>
        <div className="br-project-details-right">
          <BrButton type="sumbit" label="Select" id={'selectProject' + projID} key={'submit' + projID}
                    className="br-button br-icon-button" onClick={e => selectProject(projID)}/>
          <div className="br-separator"></div>
          { ownProject ?
              (
              proj.status === 0 ? 
                <BrButton type="sumbit" label="Publish" id={'publishProject' + projID} key={'publish' + projID}
                          className="br-button br-icon-button" onClick={e => publishProject(projID)}/>
                :
                <div className="">Published</div>
              )
              : ''
          }
          
        </div>
      </div>
    </div>
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
    <h3>Feature coming soon!</h3>
    You are not assigned to any tasks.
    <br />
    <br />
    Use the Search panel to view projects to apply for.
    <br />
    <br />
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
      setSubProjectEntry({..._projectEntry});
    }
  }, [activeProject]);

  function getSubProjectsUI() {
    let ui = [];

    for(let subProject of subProjects) {
      ui.push(getProjectDetailsPanel(subProject));
    }

    let noSubProjectsUI = <div className="br-info-message">No Subprojects have been created</div>;

    return <div>
      <h3>Subprojects</h3>
      { ui.length ? ui : noSubProjectsUI }
    </div>
  }

  function getActiveProjectPage(activeProject) {
    return <div className="br-active-project-page">
      <div className="br-back-button-holder">
        <BrButton label={<i className="fa fa-arrow-left"></i>} id="goBackActiveProject" 
                  className="br-button br-icon-button" 
                  onClick={e => setActiveProject({})} />
      </div>
      <h1>{ activeProject.name }</h1>
      <div className="br-page-panels">
        <div className="br-page-panel br-page-panel-thin">
          <h3>Project Tree</h3>
          <div className="br-project-tree">
            { subTree ?  displayTree(subTree) : '' }
          </div>
        </div>
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

      <div className="br-sub-projects">
        { getSubProjectsUI() }
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

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '8px 8px 0 0',
      padding: 0
    },
    overlay: {zIndex: 999}
  };

  function closeModal() {
    setModalState({...modalState, open: false});
  }

  const [modalIsOpen, setIsOpen] = React.useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {

  }

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <div className="br-page">
    <div>
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <div className="br-modal-title">
          <h2 className="br-modal-heading">Create Subproject</h2>
          <div className="br-modal-close">
            <BrButton label={<i className="fas fa-times-circle" />} className="br-button br-icon-button" 
                        onClick={closeModal} />
          </div>
        </div>
        <div className="br-modal-panel">
          <div className="br-modal-content>">
            { getCreateProjectForm('subtask') } 
          </div>
        </div>
      </Modal>
    </div>
      <BrModal modalState={modalState} setModalState={setModalState} />
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

