const text_consts = {
  "app_name": "Dev Pipes",
  "nft_name": "Dev Pipe",
  "nft_short_name": "Pipe"
}

const text = {
  "en": {
    "text_network_info": `Please set network to Polygon or Ropsten`,  
    "text_project_created": `Project created`,
    "text_project_creating": `Creating project on blockchain...`,
    "text_project_none": `You have no projects`,
    "text_no_project_results": `No published projects found`,
    "success_image_upload": `Image uploaded`,
    "error_project_created": 'Error creating project',
    "error_invalid_network": `Network is not supported`,
    "error_image_upload_failed": `Image upload failed`
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