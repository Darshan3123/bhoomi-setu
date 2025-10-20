import { Buffer } from 'buffer';
import axios from 'axios';
import FormData from 'form-data';

export class IPFSService {
  private pinataApiKey: string;
  private pinataSecretApiKey: string;
  private pinataJWT: string;
  private pinataApiUrl: string = 'https://api.pinata.cloud';
  private pinataGatewayUrl: string = 'https://gateway.pinata.cloud/ipfs';
  private mockMode: boolean = false;
  private uploadedFiles: Map<string, Buffer> = new Map(); // Fallback for mock mode

  constructor() {
    this.pinataApiKey = process.env.PINATA_API_KEY || '';
    this.pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY || '';
    this.pinataJWT = process.env.PINATA_JWT || '';

    // Enable mock mode if Pinata credentials are not provided
    if (!this.pinataApiKey || !this.pinataSecretApiKey) {
      this.mockMode = true;
      console.log('⚠️  IPFS Service running in mock mode - Pinata credentials not found');
    } else {
      console.log('🌐 IPFS Service connected to Pinata Cloud');
    }
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(file: Buffer, filename: string): Promise<string> {
    if (this.mockMode) {
      return this.mockUploadFile(file, filename);
    }

    try {
      const formData = new FormData();
      formData.append('file', file, filename);

      // Optional metadata
      const metadata = JSON.stringify({
        name: filename,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: 'document'
        }
      });
      formData.append('pinataMetadata', metadata);

      // Optional options
      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretApiKey,
            ...(this.pinataJWT && { 'Authorization': `Bearer ${this.pinataJWT}` })
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const ipfsHash = response.data.IpfsHash;
      console.log(`📁 Pinata IPFS upload: ${filename} -> ${ipfsHash} (${file.length} bytes)`);
      return ipfsHash;

    } catch (error: any) {
      console.error('Pinata upload error:', error.response?.data || error.message);
      throw new Error(`Failed to upload file to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Upload JSON data to IPFS via Pinata
   */
  async uploadJSON(data: any): Promise<string> {
    if (this.mockMode) {
      return this.mockUploadJSON(data);
    }

    try {
      const jsonString = JSON.stringify(data, null, 2);
      const buffer = Buffer.from(jsonString, 'utf8');
      
      const formData = new FormData();
      formData.append('file', buffer, 'data.json');

      const metadata = JSON.stringify({
        name: 'JSON Data',
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          type: 'json'
        }
      });
      formData.append('pinataMetadata', metadata);

      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretApiKey,
            ...(this.pinataJWT && { 'Authorization': `Bearer ${this.pinataJWT}` })
          }
        }
      );

      const ipfsHash = response.data.IpfsHash;
      console.log(`📄 Pinata IPFS JSON upload -> ${ipfsHash}`);
      return ipfsHash;

    } catch (error: any) {
      console.error('Pinata JSON upload error:', error.response?.data || error.message);
      throw new Error(`Failed to upload JSON to IPFS: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Retrieve file from IPFS via Pinata Gateway
   */
  async getFile(hash: string): Promise<Buffer> {
    if (this.mockMode) {
      return this.mockGetFile(hash);
    }

    try {
      console.log(`📥 Retrieving from Pinata IPFS: ${hash}`);
      
      const response = await axios.get(`${this.pinataGatewayUrl}/${hash}`, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      return Buffer.from(response.data);

    } catch (error: any) {
      console.error('Pinata retrieval error:', error.response?.data || error.message);
      throw new Error(`Failed to retrieve file from IPFS: ${error.response?.status || error.message}`);
    }
  }

  /**
   * Retrieve JSON data from IPFS
   */
  async getJSON(hash: string): Promise<any> {
    try {
      const buffer = await this.getFile(hash);
      const jsonString = buffer.toString('utf8');
      return JSON.parse(jsonString);
    } catch (error: any) {
      console.error('IPFS JSON retrieval error:', error.message);
      throw new Error('Failed to retrieve JSON from IPFS');
    }
  }

  /**
   * Pin existing file to Pinata (if not already pinned)
   */
  async pinFile(hash: string): Promise<void> {
    if (this.mockMode) {
      console.log(`📌 Mock IPFS pin: ${hash}`);
      return;
    }

    try {
      const response = await axios.post(
        `${this.pinataApiUrl}/pinning/pinByHash`,
        {
          hashToPin: hash,
          pinataMetadata: {
            name: `Pinned file ${hash}`,
            keyvalues: {
              pinnedAt: new Date().toISOString()
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretApiKey,
            ...(this.pinataJWT && { 'Authorization': `Bearer ${this.pinataJWT}` })
          }
        }
      );

      console.log(`📌 Pinata pin successful: ${hash}`);

    } catch (error: any) {
      console.error('Pinata pin error:', error.response?.data || error.message);
      throw new Error(`Failed to pin file: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Check if Pinata service is online
   */
  async isOnline(): Promise<boolean> {
    if (this.mockMode) {
      return true;
    }

    try {
      const response = await axios.get(`${this.pinataApiUrl}/data/testAuthentication`, {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretApiKey,
          ...(this.pinataJWT && { 'Authorization': `Bearer ${this.pinataJWT}` })
        },
        timeout: 10000
      });

      return response.status === 200;

    } catch (error: any) {
      console.error('Pinata connection error:', error.message);
      return false;
    }
  }

  /**
   * Get file stats from Pinata
   */
  async getFileStats(hash: string) {
    if (this.mockMode) {
      return {
        hash,
        size: 1024,
        type: 'file'
      };
    }

    try {
      const response = await axios.get(`${this.pinataApiUrl}/data/pinList?hashContains=${hash}`, {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretApiKey,
          ...(this.pinataJWT && { 'Authorization': `Bearer ${this.pinataJWT}` })
        }
      });

      const pins = response.data.rows;
      const pin = pins.find((p: any) => p.ipfs_pin_hash === hash);

      if (pin) {
        return {
          hash: pin.ipfs_pin_hash,
          size: pin.size,
          type: 'file',
          pinned: true,
          pinnedAt: pin.date_pinned
        };
      } else {
        throw new Error('File not found in Pinata');
      }

    } catch (error: any) {
      console.error('Pinata stats error:', error.response?.data || error.message);
      throw new Error(`Failed to get file stats: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * List all pinned files
   */
  async listPinnedFiles(limit: number = 10) {
    if (this.mockMode) {
      return [];
    }

    try {
      const response = await axios.get(`${this.pinataApiUrl}/data/pinList?status=pinned&pageLimit=${limit}`, {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretApiKey,
          ...(this.pinataJWT && { 'Authorization': `Bearer ${this.pinataJWT}` })
        }
      });

      return response.data.rows;

    } catch (error: any) {
      console.error('Pinata list error:', error.response?.data || error.message);
      throw new Error(`Failed to list pinned files: ${error.response?.data?.error || error.message}`);
    }
  }

  // Mock mode methods (fallback when Pinata is not configured)
  private mockUploadFile(file: Buffer, filename: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(file).digest('hex');
    const mockHash = `Qm${hash.substring(0, 44)}`;
    
    this.uploadedFiles.set(mockHash, file);
    console.log(`📁 Mock IPFS upload: ${filename} -> ${mockHash} (${file.length} bytes)`);
    return mockHash;
  }

  private mockUploadJSON(data: any): string {
    const randomPart = Math.random().toString(36).substr(2, 44);
    const mockHash = `Qm${randomPart.padEnd(44, '0')}`;
    console.log(`📄 Mock IPFS JSON upload -> ${mockHash}`);
    return mockHash;
  }

  private mockGetFile(hash: string): Buffer {
    console.log(`📥 Mock IPFS retrieve: ${hash}`);
    const file = this.uploadedFiles.get(hash);
    if (file) {
      return file;
    } else {
      throw new Error(`File not found for hash: ${hash}`);
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();