import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// IPFS client configuration
const ipfsClient = create({
  host: process.env.IPFS_HOST || 'localhost',
  port: parseInt(process.env.IPFS_PORT || '5001'),
  protocol: process.env.IPFS_PROTOCOL || 'http'
});

export interface IPFSUploadOptions {
  filename: string;
  contentType: string;
  documentType: string;
  uploadedBy: string;
}

export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

/**
 * Upload file to IPFS
 */
export async function uploadToIPFS(
  fileBuffer: Buffer,
  options: IPFSUploadOptions
): Promise<IPFSUploadResult> {
  try {
    // Create metadata object
    const metadata = {
      filename: options.filename,
      contentType: options.contentType,
      documentType: options.documentType,
      uploadedBy: options.uploadedBy,
      uploadedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Create file object for IPFS
    const fileObject = {
      path: options.filename,
      content: fileBuffer
    };

    // Create metadata file
    const metadataObject = {
      path: `${options.filename}.metadata.json`,
      content: Buffer.from(JSON.stringify(metadata, null, 2))
    };

    // Upload both file and metadata to IPFS
    const results = await ipfsClient.addAll([fileObject, metadataObject], {
      wrapWithDirectory: true,
      pin: true
    });

    let fileHash = '';
    let directoryHash = '';

    for await (const result of results) {
      if (result.path === options.filename) {
        fileHash = result.cid.toString();
      } else if (result.path === '') {
        directoryHash = result.cid.toString();
      }
    }

    const ipfsGatewayUrl = `${process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs'}/${fileHash}`;

    return {
      success: true,
      hash: fileHash,
      url: ipfsGatewayUrl
    };

  } catch (error: any) {
    console.error('IPFS upload error:', error);
    return {
      success: false,
      error: error?.message || 'IPFS upload failed'
    };
  }
}

/**
 * Get file from IPFS
 */
export async function getFromIPFS(hash: string): Promise<{
  success: boolean;
  data?: Buffer;
  error?: string;
}> {
  try {
    const chunks = [];
    
    for await (const chunk of ipfsClient.cat(hash)) {
      chunks.push(chunk);
    }
    
    const data = Buffer.concat(chunks);
    
    return {
      success: true,
      data
    };

  } catch (error: any) {
    console.error('IPFS get error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get file from IPFS'
    };
  }
}

/**
 * Pin file to IPFS (ensure it stays available)
 */
export async function pinToIPFS(hash: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await ipfsClient.pin.add(hash);
    
    return {
      success: true
    };

  } catch (error: any) {
    console.error('IPFS pin error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to pin file to IPFS'
    };
  }
}

/**
 * Get IPFS node info
 */
export async function getIPFSNodeInfo(): Promise<{
  success: boolean;
  info?: any;
  error?: string;
}> {
  try {
    const info = await ipfsClient.id();
    
    return {
      success: true,
      info
    };

  } catch (error: any) {
    console.error('IPFS node info error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get IPFS node info'
    };
  }
}

/**
 * Check if IPFS is available
 */
export async function checkIPFSConnection(): Promise<boolean> {
  try {
    await ipfsClient.version();
    return true;
  } catch (error) {
    console.error('IPFS connection check failed:', error);
    return false;
  }
}

/**
 * Get file metadata from IPFS
 */
export async function getFileMetadata(hash: string): Promise<{
  success: boolean;
  metadata?: any;
  error?: string;
}> {
  try {
    const metadataHash = `${hash}.metadata.json`;
    const result = await getFromIPFS(metadataHash);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: 'Metadata not found'
      };
    }
    
    const metadata = JSON.parse(result.data.toString());
    
    return {
      success: true,
      metadata
    };

  } catch (error: any) {
    console.error('Get metadata error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get file metadata'
    };
  }
}