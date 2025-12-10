-- =====================================================
-- GM FORGE WEB - SUPABASE SETUP COMPLETO
-- Copie e cole TUDO de uma vez no SQL Editor
-- =====================================================

-- 1. CRIAR TABELAS
-- =====================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  players INTEGER DEFAULT 4,
  progress INTEGER DEFAULT 0,
  next_session TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS npcs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  campaign_id BIGINT REFERENCES campaigns ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🧙',
  type TEXT NOT NULL CHECK (type IN ('Aliado', 'Inimigo', 'Boss')),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  description TEXT,
  strength INTEGER DEFAULT 0 CHECK (strength >= 0 AND strength <= 5),
  skill INTEGER DEFAULT 0 CHECK (skill >= 0 AND skill <= 5),
  resistance INTEGER DEFAULT 0 CHECK (resistance >= 0 AND resistance <= 5),
  armor INTEGER DEFAULT 0 CHECK (armor >= 0 AND armor <= 5),
  firepower INTEGER DEFAULT 0 CHECK (firepower >= 0 AND firepower <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. CRIAR INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS npcs_user_id_idx ON npcs(user_id);
CREATE INDEX IF NOT EXISTS npcs_campaign_id_idx ON npcs(campaign_id);

-- 3. HABILITAR ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;

-- 4. CRIAR POLICIES - CAMPAIGNS
-- =====================================================

DROP POLICY IF EXISTS "campaigns_select_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_insert_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_policy" ON campaigns;
DROP POLICY IF EXISTS "campaigns_delete_policy" ON campaigns;

CREATE POLICY "campaigns_select_policy"
  ON campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "campaigns_insert_policy"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_update_policy"
  ON campaigns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_delete_policy"
  ON campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- 5. CRIAR POLICIES - NPCS
-- =====================================================

DROP POLICY IF EXISTS "npcs_select_policy" ON npcs;
DROP POLICY IF EXISTS "npcs_insert_policy" ON npcs;
DROP POLICY IF EXISTS "npcs_update_policy" ON npcs;
DROP POLICY IF EXISTS "npcs_delete_policy" ON npcs;

CREATE POLICY "npcs_select_policy"
  ON npcs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "npcs_insert_policy"
  ON npcs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "npcs_update_policy"
  ON npcs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "npcs_delete_policy"
  ON npcs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SETUP COMPLETO! ✅
-- 
-- Próximo passo:
-- 1. Copiar Project URL + anon key
-- 2. Atualizar web/src/main.js
-- 3. Reload app e testar!
-- =====================================================
