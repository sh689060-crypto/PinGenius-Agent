export interface Blueprint {
  layout_structure: string;
  fonts_typography: string;
  color_theme: string;
  text_elements: string;
  visual_style: string;
  contrast_readability: string;
  aspect_ratio: string;
}

export interface PinterestContent {
  title: string;
  description: string;
  alt_text: string;
  tags: string[];
  hashtags: string[];
  blueprint: Blueprint;
  image_prompt: string;
  export_instructions: string;
  api_json: {
    title: string;
    description: string;
    alt_text: string;
    hashtags: string[];
    tags: string[];
    board_id: string;
    media_source: {
      type: string;
      images: {
        png_download_url: string;
        jpg_download_url: string;
      }
    }
  };
}

export interface GeneratedResponse {
  pinterestContent: PinterestContent;
}