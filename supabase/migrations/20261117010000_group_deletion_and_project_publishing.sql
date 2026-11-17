-- Migration: 20261117010000_group_deletion_and_project_publishing.sql
-- Description: Group deletion policies, published projects deletion, group posts/comments policies, and member security updates.

-- 1. Ensure is_group_member function checks both group_members table and group creator_id
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$$;

-- 2. Ensure is_group_admin function checks owner, admin role or creator_id
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role IN ('owner', 'admin')
  ) OR EXISTS (
    SELECT 1 FROM public.community_groups
    WHERE id = p_group_id AND creator_id = p_user_id
  );
$$;

-- 3. RLS: community_groups DELETE Policy
-- Only authorized group owners and admins can permanently delete groups.
-- Moderator, member, or non-member cannot delete groups.
-- Applies equally to public and private groups.
DROP POLICY IF EXISTS "Group owners and admins can delete group" ON public.community_groups;
CREATE POLICY "Group owners and admins can delete group"
  ON public.community_groups FOR DELETE
  TO authenticated
  USING (public.is_group_admin(id, auth.uid()));

-- 4. RLS: community_group_members DELETE Policy
-- Allow group admins to delete members (including during group deletion cascade)
DROP POLICY IF EXISTS "Users can leave group or creator can remove" ON public.community_group_members;
DROP POLICY IF EXISTS "Users can leave group or group admins can remove" ON public.community_group_members;
CREATE POLICY "Users can leave group or group admins can remove"
  ON public.community_group_members FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR public.is_group_admin(group_id, auth.uid())
  );

-- 5. RLS: community_group_posts DELETE Policy
-- Authors and group admins can delete group posts
DROP POLICY IF EXISTS "Authors and group admins can delete group posts" ON public.community_group_posts;
CREATE POLICY "Authors and group admins can delete group posts"
  ON public.community_group_posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id 
    OR public.is_group_admin(group_id, auth.uid())
  );

-- 6. RLS: community_group_comments INSERT Policy
-- Public groups: all authenticated users can comment
-- Private groups: only group members can comment
DROP POLICY IF EXISTS "Members can insert group comments" ON public.community_group_comments;
DROP POLICY IF EXISTS "Members or public group users can insert group comments" ON public.community_group_comments;
CREATE POLICY "Members or public group users can insert group comments"
  ON public.community_group_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND (
      public.is_group_member(group_id, auth.uid()) OR
      EXISTS (SELECT 1 FROM public.community_groups WHERE id = group_id AND visibility = 'public')
    )
  );

-- 7. RLS: published_projects DELETE Policy
-- Authors can delete/unpublish their own published projects
DROP POLICY IF EXISTS "Authors can delete published projects" ON public.published_projects;
CREATE POLICY "Authors can delete published projects"
  ON public.published_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- 8. Add category and cover_url to published_projects if not present
ALTER TABLE public.published_projects 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS cover_url TEXT DEFAULT NULL;

-- 9. Seed curated initial discussions into community_posts if table is empty
INSERT INTO public.community_posts (id, author_id, author_name, author_handle, title, body, category, tags, moderation_status, comment_count, created_at)
SELECT 
  'a1111111-1111-4111-8111-111111111111'::uuid,
  COALESCE((SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'Alex Rivera',
  'alex_circuits',
  'Why did adding a pedestrian button trigger a pin conflict on Pin 2?',
  'I was remixing the Starter Traffic Light project to add a crosswalk push button. When I hooked up the button to digital pin 7 on the canvas but defined BUTTON_PIN as 2 in my Arduino sketch, Tracewise immediately warned me that Pin 2 was already driving the Red LED anode! After changing BUTTON_PIN = 7, everything worked perfectly. Always double-check your code against your breadboard wiring.',
  'Debugging Help',
  ARRAY['Arduino Uno', 'Pin Collision', 'Traffic Light', 'Debugging'],
  'approved',
  2,
  NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (SELECT 1 FROM public.community_posts WHERE title LIKE '%pedestrian button%');

INSERT INTO public.community_posts (id, author_id, author_name, author_handle, title, body, category, tags, moderation_status, comment_count, created_at)
SELECT 
  'a2222222-2222-4222-8222-222222222222'::uuid,
  COALESCE((SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'Maya Patel',
  'maya_robotics',
  'Visualizing forward voltage and why 220Ω protects your LED',
  'A quick tip for beginners building physical circuits after designing in Tracewise: standard red 5mm LEDs drop around 1.8V to 2.1V forward voltage. Connecting it directly from Arduino 5V to GND draws way more than the 20mA limit of ATmega328P pins. Using a 220Ω resistor limits current to approximately (5V - 2V) / 220Ω = 13.6mA, keeping the LED bright and safe forever.',
  'Showcase',
  ARRAY['Circuits 101', 'Ohm''s Law', 'LED Protection', 'Hardware Safety'],
  'approved',
  1,
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM public.community_posts WHERE title LIKE '%forward voltage%');
