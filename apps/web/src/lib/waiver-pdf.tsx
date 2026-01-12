// @ts-nocheck - @react-pdf/renderer has React type compatibility issues
import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

// Register a standard font (Helvetica is built-in)
// For production, you might want to register custom fonts

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563EB',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 140,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
  },
  value: {
    flex: 1,
    color: '#1a1a1a',
  },
  waiverContent: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 20,
  },
  waiverText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#374151',
  },
  signatureBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    border: '1px solid #bfdbfe',
  },
  signatureTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    marginBottom: 15,
  },
  agreementText: {
    fontSize: 10,
    color: '#1e40af',
    fontStyle: 'italic',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9ca3af',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  checkmark: {
    fontSize: 14,
    color: '#16a34a',
    marginRight: 8,
  },
})

interface WaiverPdfData {
  eventName: string
  eventId: string
  signeeName: string
  signeeEmail: string
  signedAt: Date
  templateName: string | null
  templateVersion: number | null
  waiverContent: string
  agreedText: string
  signatureType: string
  ipAddress: string | null
  userAgent: string | null
}

function WaiverDocument({ data }: { data: WaiverPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Signed Liability Waiver</Text>
          <Text style={styles.subtitle}>SweatBuddies - {data.eventName}</Text>
        </View>

        {/* Event Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Event Name:</Text>
            <Text style={styles.value}>{data.eventName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Event ID:</Text>
            <Text style={styles.value}>{data.eventId}</Text>
          </View>
          {data.templateName && (
            <View style={styles.row}>
              <Text style={styles.label}>Waiver Template:</Text>
              <Text style={styles.value}>
                {data.templateName}
                {data.templateVersion ? ` (v${data.templateVersion})` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Signee Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participant Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.signeeName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.signeeEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date Signed:</Text>
            <Text style={styles.value}>
              {data.signedAt.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              })}
            </Text>
          </View>
        </View>

        {/* Waiver Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waiver Terms</Text>
          <View style={styles.waiverContent}>
            <Text style={styles.waiverText}>{data.waiverContent}</Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>Digital Signature Confirmation</Text>
          <Text style={styles.agreementText}>
            "{data.agreedText}"
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Signature Type:</Text>
            <Text style={styles.value}>
              {data.signatureType === 'checkbox' ? 'Checkbox Agreement' : 'Typed Signature'}
            </Text>
          </View>
          {data.ipAddress && (
            <View style={styles.row}>
              <Text style={styles.label}>IP Address:</Text>
              <Text style={styles.value}>{data.ipAddress}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This document was generated by SweatBuddies. The digital signature above constitutes a legally binding agreement.
          {'\n'}Document ID: {data.eventId}-{data.signeeEmail.replace(/[^a-zA-Z0-9]/g, '')}-{data.signedAt.getTime()}
        </Text>
      </Page>
    </Document>
  )
}

export async function generateWaiverPdf(data: WaiverPdfData): Promise<Buffer> {
  const doc = <WaiverDocument data={data} />
  const pdfBlob = await pdf(doc).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export { WaiverDocument }
export type { WaiverPdfData }
