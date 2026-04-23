/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL =
  'https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your 1st Assist verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="56" height="56" alt="1st Assist" style={logo} />
        </Section>
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Section style={codeWrap}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request it, you can safely
          ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { borderRadius: '12px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#141414',
  letterSpacing: '-0.01em',
  margin: '0 0 18px',
}
const text = {
  fontSize: '15px',
  color: '#4a4a4a',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const codeWrap = {
  backgroundColor: '#f7f3ea',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '24px 0',
}
const codeStyle = {
  fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#141414',
  letterSpacing: '0.3em',
  margin: '0',
}
const divider = { borderColor: '#eaeaea', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
