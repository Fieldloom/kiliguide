INSERT INTO public.system_settings (key, value) VALUES ('show_documents_to_users', 'false') ON CONFLICT (key) DO NOTHING;
