-- Enforce max 20 conversations per user
CREATE OR REPLACE FUNCTION public.enforce_conversation_limit()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.conversations
  WHERE id IN (
    SELECT id FROM public.conversations
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_enforce_conversation_limit
AFTER INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_conversation_limit();

-- Enforce max 50 messages per conversation
CREATE OR REPLACE FUNCTION public.enforce_message_limit()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.messages
  WHERE id IN (
    SELECT id FROM public.messages
    WHERE conversation_id = NEW.conversation_id
    ORDER BY created_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_enforce_message_limit
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.enforce_message_limit();

-- Enforce max 5 personal resources per user
CREATE OR REPLACE FUNCTION public.enforce_personal_resource_limit()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.personal_resources
  WHERE id IN (
    SELECT id FROM public.personal_resources
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_enforce_personal_resource_limit
AFTER INSERT ON public.personal_resources
FOR EACH ROW
EXECUTE FUNCTION public.enforce_personal_resource_limit();
