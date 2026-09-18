# SecureChat calling configuration

SecureChat uses two public Google STUN servers by default. STUN is enough for many local and simple NAT connections, but it cannot relay media when peers are behind restrictive, symmetric, corporate, or carrier-grade NAT. Production calls across unrelated networks therefore require TURN.

Configure these variables in the Vercel frontend environment and redeploy:

```env
VITE_TURN_URL=turns:turn.example.com:5349
VITE_TURN_USERNAME=generated-turn-username
VITE_TURN_CREDENTIAL=generated-turn-credential
```

Use short-lived TURN credentials when supported by the provider. Never commit TURN credentials. A Coturn deployment or a managed TURN provider may be used; the TURN server must be reachable by both clients, and TLS on port 5349 is recommended for restrictive networks.

Without TURN, a successful signaling exchange does not guarantee that audio or video media can traverse the network.
