export interface XtreamUser {
  username: string;
  password?: string;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface XtreamServer {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
}

export interface XtreamAuthResponse {
  user_info: XtreamUser;
  server_info: XtreamServer;
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
  thumbnail?: string;
  container_extension?: string;
  rating?: string;
  year?: string;
}

export interface EPGProgram {
  id: string;
  start: string;
  end: string;
  title: string;
  description: string;
  start_timestamp: string;
  end_timestamp: string;
  stop_timestamp?: string;
}

export interface XtreamEPGResponse {
  epg_listings: EPGProgram[];
}
