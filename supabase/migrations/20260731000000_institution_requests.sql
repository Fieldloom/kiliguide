-- Migration: Institution Requests (Super Admin Approval Flow)

CREATE TABLE IF NOT EXISTS public.institution_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Institution details
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    theme_color TEXT DEFAULT '#10b981',
    logo_url TEXT,
    -- Admin details
    admin_email TEXT NOT NULL,
    admin_name TEXT,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.institution_requests ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view and manage all requests
CREATE POLICY "Super admins can manage institution requests" ON institution_requests
FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Anyone can insert (submit a request)
CREATE POLICY "Anyone can submit institution request" ON institution_requests
FOR INSERT WITH CHECK (true);

-- Also update user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE email = 'griffinwekesa65@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
