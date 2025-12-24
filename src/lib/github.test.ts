import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { healthCheck, setGithubAttachmentSettings, syncAttachmentToGithub, __setGithubTokenForTests } from './github'

function setEnv(token?: string) {
  ;(import.meta as any).env = {
    ...(import.meta as any).env,
    VITE_GITHUB_TOKEN: token,
    VITE_GITHUB_OWNER: 'owner',
    VITE_GITHUB_REPO: 'repo',
    VITE_GITHUB_BRANCH: 'main',
  }
}

describe('GitHub integration', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    setGithubAttachmentSettings({ notifications: { inGame: false, console: false } })
  })
  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('healthCheck falha sem token', async () => {
    __setGithubTokenForTests(undefined)
    const res = await healthCheck()
    expect(res.ok).toBe(false)
    expect((res as any).error).toMatch(/VITE_GITHUB_TOKEN/)
  })

  it('upload e comentar issue com REST simulados', async () => {
    __setGithubTokenForTests('token123')
    setGithubAttachmentSettings({ repo: { owner: 'owner', repo: 'repo', branch: 'main' } })
    // mock rate_limit
    vi.spyOn(global, 'fetch').mockImplementationOnce(async () =>
      new Response(JSON.stringify({ resources: { core: { remaining: 4999, reset: Date.now() / 1000 } } }), { status: 200 })
    )
    const hc = await healthCheck()
    expect(hc.ok).toBe(true)

    // mock PUT contents
    vi.spyOn(global, 'fetch').mockImplementationOnce(async () =>
      new Response(
        JSON.stringify({ content: { download_url: 'https://raw.githubusercontent.com/owner/repo/main/attachments/x.png', sha: 'abc123' } }),
        { status: 201 }
      )
    )
    // mock POST issue comment
    vi.spyOn(global, 'fetch').mockImplementationOnce(async () =>
      new Response(JSON.stringify({ html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123' }), { status: 201 })
    )

    const png = 'data:image/png;base64,AAA'
    const res = await syncAttachmentToGithub({ dataUrl: png, mime: 'image/png', originalName: 'avatar.png', issueNumber: 1 })
    expect(res.ok).toBe(true)
    expect(res.ok && res.data.rawUrl).toMatch(/raw.githubusercontent/)
  })

  it('respeita filtro de tipos', async () => {
    __setGithubTokenForTests('token123')
    setGithubAttachmentSettings({ repo: { owner: 'owner', repo: 'repo', branch: 'main' } })
    setGithubAttachmentSettings({ fileTypeFilter: ['image/png'] })
    const res = await syncAttachmentToGithub({ dataUrl: 'data:image/jpeg;base64,BBB', mime: 'image/jpeg', originalName: 'photo.jpg' })
    expect(res.ok).toBe(false)
  })
})
