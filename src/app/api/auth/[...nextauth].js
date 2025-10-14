import NextAuth from 'next-auth'

const authOptions = {
  providers: [
    {
      id: 'bsky-oauth',
      name: 'BlueskyOAuth',
      type: 'oauth',
      version: '2.0',
      wellKnown: undefined, // we'll provide endpoints explicitly
      authorization: {
        url: '/api/oauth/authorize',
        params: { scope: 'openid profile email' },
      },
      token: { url: '/api/oauth/callback' }, // token endpoint that exchanges code -> tokens
      userinfo: { url: '/api/oauth/client-metadata' }, // adapt if different
      jwks: { url: '/api/oauth/jwks' }, // NextAuth doesn't directly use jwks here, but keep for reference
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      checks: ['pkce', 'state'],
      profile(profile) {
        // Map provider profile to NextAuth user object
        return {
          id: profile.sub || profile.id || profile.handle,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expires_at = account.expires_at || null
      }
      return token
    },
    async session({ session, token }) {
      session.user = session.user || {}
      session.user.id = token.sub
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    },
  },
  pages: {
    signIn: '/auth/signin', // optional custom sign-in page
  },
}

export default NextAuth(authOptions)
