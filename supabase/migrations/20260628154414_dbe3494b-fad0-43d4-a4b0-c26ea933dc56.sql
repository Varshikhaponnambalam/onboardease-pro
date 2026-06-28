
-- search_path fix for the trigger fn that didn't set it
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke execute from public/anon on internal helpers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_progress_after_upload() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Storage policies for employee-documents bucket. Path layout: <user_id>/<doc_type>/<file>
CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own docs or HR all" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'employee-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'hr')));

CREATE POLICY "Users update own docs" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'employee-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own docs or HR" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'employee-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'hr')));
