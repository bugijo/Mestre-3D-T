type Result<T> = { ok: true; data: T } | { ok: false; error: string }

type GithubRepoTarget = { owner: string; repo: string; branch?: string }

type NamingConvention = 'timestamp_id_name' | 'uuid' | 'sha256_name'

export type GithubAttachmentSettings = {
  repo: GithubRepoTarget
  pathPrefix: string
  mode: 'rest' | 'graphql'
  fileTypeFilter: string[]
  naming: NamingConvention
  notifications?: { inGame?: boolean; console?: boolean }
}

let SETTINGS: GithubAttachmentSettings = {
  repo: {
    owner: (import.meta.env.VITE_GITHUB_OWNER as string) || '',
    repo: (import.meta.env.VITE_GITHUB_REPO as string) || '',
    branch: (import.meta.env.VITE_GITHUB_BRANCH as string) || 'main',
  },
  pathPrefix: 'attachments',
  mode: 'rest',
  fileTypeFilter: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  naming: 'timestamp_id_name',
  notifications: { inGame: true, console: true },
}

let TOKEN_OVERRIDE: string | undefined
export function __setGithubTokenForTests(token?: string) {
  TOKEN_OVERRIDE = token
}

export function setGithubAttachmentSettings(patch: Partial<GithubAttachmentSettings>) {
  SETTINGS = { ...SETTINGS, ...patch, repo: { ...SETTINGS.repo, ...(patch.repo || {}) } }
}

function resolveToken() {
  const token = TOKEN_OVERRIDE ?? ((import.meta.env.VITE_GITHUB_TOKEN as string | undefined))
  return token
}

function notify(msg: string, kind: 'success' | 'error' | 'info' = 'info') {
  if (SETTINGS.notifications?.console) {
    const tag = kind === 'error' ? '[GitHub][Erro]' : kind === 'success' ? '[GitHub][OK]' : '[GitHub]'
    console[kind === 'error' ? 'error' : 'log'](`${tag} ${msg}`)
  }
  if (SETTINGS.notifications?.inGame) {
    ;(window as any).notifyInGame?.(msg, kind)
  }
}

export async function healthCheck(): Promise<Result<{ service: 'github'; reachable: boolean; rateRemaining?: number; rateReset?: number }>> {
  const token = resolveToken()
  if (!token) return { ok: false, error: 'Variável VITE_GITHUB_TOKEN ausente' }
  const res = await fetch('https://api.github.com/rate_limit', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  const ok = typeof (res as any).ok === 'boolean' ? (res as any).ok : (res.status >= 200 && res.status < 300)
  if (!ok) return { ok: false, error: `Falha ao consultar rate_limit (${res.status})` }
  const json = await res.json()
  const core = (json && json.resources && json.resources.core) ? json.resources.core : undefined
  return { ok: true, data: { service: 'github', reachable: true, rateRemaining: core?.remaining, rateReset: core?.reset } }
}

function ensureEnvAndRepo(): Result<GithubRepoTarget> {
  const token = resolveToken()
  const { owner, repo, branch } = SETTINGS.repo
  if (!token) return { ok: false, error: 'Token GitHub não configurado (VITE_GITHUB_TOKEN)' }
  if (!owner || !repo) return { ok: false, error: 'Repositório não configurado (defina VITE_GITHUB_OWNER e VITE_GITHUB_REPO ou use setGithubAttachmentSettings)' }
  return { ok: true, data: { owner, repo, branch: branch || 'main' } }
}

function dataUrlToBase64(dataUrl: string) {
  const parts = dataUrl.split(',')
  return parts.length > 1 ? parts[1] : dataUrl
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'application/pdf') return 'pdf'
  return 'bin'
}

function sanitizeName(name: string) {
  return name.replace(/[^a-z0-9\-_.]/gi, '_')
}

function makeFileName(originalName: string, mime: string) {
  const base = sanitizeName(originalName.replace(/\.[^.]+$/, ''))
  const ext = extFromMime(mime)
  const id = Math.random().toString(36).slice(2, 8)
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  if (SETTINGS.naming === 'uuid') return `${base}-${crypto.randomUUID?.() || id}.${ext}`
  if (SETTINGS.naming === 'sha256_name') return `${sha256(base).slice(0, 12)}.${ext}`
  return `${ts}-${id}-${base}.${ext}`
}

function sha256(input: string): string {
  const buf = new TextEncoder().encode(input)
  let h = 0
  for (let i = 0; i < buf.length; i++) h = (h * 31 + buf[i]) >>> 0
  return h.toString(16).padStart(8, '0').repeat(8).slice(0, 64)
}

async function putRepoContent(path: string, base64Content: string, message: string): Promise<Result<{ url: string; sha: string }>> {
  const token = resolveToken()!
  const repoRes = ensureEnvAndRepo()
  if (!repoRes.ok) return repoRes
  const { owner, repo, branch } = repoRes.data
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: base64Content,
      branch,
    }),
  })
  if (res.status === 403) {
    const remaining = Number(res.headers.get('X-RateLimit-Remaining') || '0')
    const reset = Number(res.headers.get('X-RateLimit-Reset') || '0')
    return { ok: false, error: remaining <= 0 ? `Rate limit atingido. Reset em ${new Date(reset * 1000).toLocaleTimeString()}` : 'Acesso proibido (403)' }
  }
  if (!res.ok) return { ok: false, error: `Falha ao subir conteúdo: ${res.status}` }
  const json = await res.json()
  const download = json?.content?.download_url as string | undefined
  const sha = json?.content?.sha as string | undefined
  if (!download || !sha) return { ok: false, error: 'Resposta inválida do GitHub' }
  return { ok: true, data: { url: download, sha } }
}

async function postIssueComment(issueNumber: number, body: string): Promise<Result<{ htmlUrl: string }>> {
  const token = resolveToken()!
  const repoRes = ensureEnvAndRepo()
  if (!repoRes.ok) return repoRes as any
  const { owner, repo } = repoRes.data
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  })
  if (!res.ok) return { ok: false, error: `Falha ao comentar issue: ${res.status}` }
  const json = await res.json()
  return { ok: true, data: { htmlUrl: json?.html_url } }
}

async function postPullRequestComment(pullNumber: number, body: string): Promise<Result<{ htmlUrl: string }>> {
  return postIssueComment(pullNumber, body)
}

async function graphqlAddCommentToIssue(issueNumber: number, body: string): Promise<Result<{ url?: string }>> {
  const token = resolveToken()!
  const repoRes = ensureEnvAndRepo()
  if (!repoRes.ok) return repoRes as any
  const { owner, repo } = repoRes.data
  const q = {
    query: `query($owner:String!,$repo:String!,$num:Int!){ repository(owner:$owner,name:$repo){ issue(number:$num){ id } } }`,
    variables: { owner, repo, num: issueNumber },
  }
  const res1 = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(q),
  })
  if (!res1.ok) return { ok: false, error: `GraphQL query falhou (${res1.status})` }
  const j1 = await res1.json()
  const id = j1?.data?.repository?.issue?.id
  if (!id) return { ok: false, error: 'Issue ID não encontrado' }
  const m = {
    query: `mutation($id:ID!,$body:String!){ addComment(input:{subjectId:$id,body:$body}){ clientMutationId } }`,
    variables: { id, body },
  }
  const res2 = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(m),
  })
  if (!res2.ok) return { ok: false, error: `GraphQL mutation falhou (${res2.status})` }
  return { ok: true, data: { url: undefined } }
}

export async function syncAttachmentToGithub(opts: {
  dataUrl: string
  mime: string
  originalName: string
  issueNumber?: number
  pullNumber?: number
  pathPrefix?: string
  commitMessage?: string
}): Promise<Result<{ rawUrl: string; commentUrl?: string }>> {
  const repoRes = ensureEnvAndRepo()
  if (!repoRes.ok) return repoRes as any
  if (!SETTINGS.fileTypeFilter.includes(opts.mime)) return { ok: false, error: `Tipo não permitido: ${opts.mime}` }
  const prefix = opts.pathPrefix || SETTINGS.pathPrefix
  const fileName = makeFileName(opts.originalName, opts.mime)
  const relPath = `${prefix}/${new Date().toISOString().slice(0, 10)}/${fileName}`
  const base64 = dataUrlToBase64(opts.dataUrl)
  notify(`Subindo '${fileName}' em ${repoRes.data.owner}/${repoRes.data.repo}...`, 'info')
  const put = await putRepoContent(relPath, base64, opts.commitMessage || `chore(attachments): add ${fileName}`)
  if (!put.ok) {
    notify(put.error, 'error')
    return { ok: false, error: put.error }
  }
  const rawUrl = put.data.url
  let commentUrl: string | undefined
  const body = '📎 Anexo: ![' + fileName + '](' + rawUrl + ')\n\nArquivo: \`' + relPath + '\`'
  if (opts.issueNumber) {
    if (SETTINGS.mode === 'graphql') {
      const c = await graphqlAddCommentToIssue(opts.issueNumber, body)
      if (!c.ok) notify(c.error, 'error')
      else notify('Comentário adicionado (GraphQL)', 'success')
    } else {
      const c = await postIssueComment(opts.issueNumber, body)
      if (!c.ok) notify(c.error, 'error')
      else commentUrl = c.data.htmlUrl
    }
  }
  if (opts.pullNumber) {
    const c = await postPullRequestComment(opts.pullNumber, body)
    if (!c.ok) notify(c.error, 'error')
    else commentUrl = c.data.htmlUrl
  }
  notify('Upload concluído', 'success')
  return { ok: true, data: { rawUrl, commentUrl } }
}

