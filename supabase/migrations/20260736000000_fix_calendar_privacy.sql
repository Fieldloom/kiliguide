-- Fix Privacy Leak on Calendar Events
-- The "Tenant Isolation: Events" policy accidentally allowed anyone in the same institution to view everyone else's personal calendar events.
-- We must restrict it back to ONLY the owner of the event.

DROP POLICY IF EXISTS "Tenant Isolation: Events" ON public.calendar_events;

-- Ensure the original owner policy exists and strictly enforces ownership
DROP POLICY IF EXISTS "calendar events own" ON public.calendar_events;
CREATE POLICY "calendar events own" ON public.calendar_events FOR ALL TO authenticated USING (
    user_id = auth.uid()
) WITH CHECK (
    user_id = auth.uid()
);
