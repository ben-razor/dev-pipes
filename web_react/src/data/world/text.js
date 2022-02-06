const text_consts = {
  "app_name": "Dev Pipes",
  "nft_name": "Dev Pipe",
  "nft_short_name": "Pipe"
}

const text = {
  "en": {
    "text_network_info": `Please set network to Polygon`,  
    "text_project_created": `Project created`,
    "text_project_updated": `Project updated`,
    "text_project_creating": `Creating project on blockchain...`,
    "text_project_updating": `Updating project on blockchain...`,
    "text_project_none": `You have no projects`,
    "text_no_project_results": `No published projects found`,
    "success_image_upload": `Image uploaded`,
    "error_no_ethereum": `No wallet detected. Try Metamask!`,
    "error_project_created": 'Error creating project',
    "error_project_updated": 'Error updating project',
    "error_invalid_network": `Network is not supported`,
    "error_image_upload_failed": `Image upload failed`,
    "error_metamast_accounts_pending": `A connection request is pending`,
    "error_please_check_wallet": `Please check your Eth Wallet`,
    "error_published_projects_cannot_be_edited": `Published projects cannot be edited`,
    "error_only_project_creator_can_edit": `Only project creator can edit project`,
    "error_only_application_creator_can_edit": `Only application creator can edit application`,
    "error_project_expired": `Project has expired`,
    "error_project_does_not_exist": `Project does not exist`,
    "error_royalties_exceed_total_available": `Royalties exceed total for parent project`
  }
};

const langs = ["en"];
let lang = langs[0];

export default function getText(id) {
  return text[lang][id] || id;
}

export function exclamation(text) {
  return text + '!!';
}