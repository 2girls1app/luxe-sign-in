/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

import type { TemplateEntry } from './registry.ts'

const LOGO_URL =
  'https://gxjrkrbzmfsoblylbjif.supabase.co/storage/v1/object/public/email-assets/logo.png'

const APP_URL = 'https://firstassist.app'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to First Assist — your OR is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="56" height="56" alt="First Assist" style={logo} />
        </Section>
        <Heading style={h1}>
          {name ? `Welcome, ${name}.` : 'Welcome to First Assist.'}
        </Heading>
        <Text style={lede}>
          Your account is verified and your workspace is ready.
        </Text>
        <Text style={text}>
          First Assist is the operating room preference card platform built for
          surgical teams — designed to keep every case organized, every
          preference precise, and every team in sync.
        </Text>
        <Text style={text}>Here's how to get the most out of it:</Text>
        <Section style={listWrap}>
          <Text style={listItem}>
            <span style={bullet}>◆</span> Set up your profile and clinical specialty
          </Text>
          <Text style={listItem}>
            <span style={bullet}>◆</span> Add your facility and core procedures
          </Text>
          <Text style={listItem}>
            <span style={bullet}>◆</span> Build preference cards manually or with AI
          </Text>
        </Section>
        <Section style={buttonWrap}>
          <Button style={button} href={APP_URL}>
            Open First Assist
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          We're glad to have you on board. If you have any questions, simply
          reply to this email — a real person will get back to you.
        </Text>
        <Text style={signature}>— The First Assist Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to First Assist',
  displayName: 'Welcome email',
  previewData: { name: 'Dr. Bagga' },
} satisfies TemplateEntry

export default WelcomeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const logoSection = { marginBottom: '24px' }
const logo = { borderRadius: '12px' }
const h1 = {
  fontSize: '26px',
  fontWeight: 'bold' as const,
  color: '#141414',
  letterSpacing: '-0.01em',
  margin: '0 0 12px',
}
const lede = {
  fontSize: '16px',
  color: '#141414',
  lineHeight: '1.5',
  margin: '0 0 20px',
  fontWeight: '500' as const,
}
const text = {
  fontSize: '15px',
  color: '#4a4a4a',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const listWrap = {
  backgroundColor: '#f7f3ea',
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '20px 0 8px',
}
const listItem = {
  fontSize: '14px',
  color: '#141414',
  lineHeight: '1.6',
  margin: '0 0 6px',
}
const bullet = {
  color: '#a8843b',
  marginRight: '10px',
  fontSize: '12px',
}
const buttonWrap = { margin: '28px 0 8px' }
const button = {
  backgroundColor: '#141414',
  color: '#c9a961',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  letterSpacing: '0.02em',
}
const divider = { borderColor: '#eaeaea', margin: '32px 0 20px' }
const footer = {
  fontSize: '13px',
  color: '#666666',
  margin: '0 0 12px',
  lineHeight: '1.6',
}
const signature = {
  fontSize: '13px',
  color: '#a8843b',
  fontWeight: '600' as const,
  margin: '0',
  letterSpacing: '0.02em',
}
