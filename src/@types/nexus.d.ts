export type ModResponse = {
  files: FileData[];
  file_updates: FileUpdate[];
};

export type FileData = {
  id: number[];
  uid: number;
  file_id: number;
  name: string;
  version: string;
  category_id: number;
  category_name: string;
  is_primary: boolean;
  size: number;
  file_name: string;
  uploaded_timestamp: number;
  uploaded_time: string;
  mod_version: string;
  external_virus_scan_url: string;
  description: string;
  size_kb: number;
  size_in_bytes: number;
  changelog_html: string;
  content_preview_link: string;
}

export type FileUpdate = {
  old_file_id: number;
  new_file_id: number;
  old_file_name: string;
  new_file_name: string;
  uploaded_timestamp: number;
  uploaded_time: string;
}