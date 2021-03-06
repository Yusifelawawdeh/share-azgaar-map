import { ServerResponse } from 'http';
import { RequestHandler, send } from 'micro';
import { upload } from 'micro-upload';

import { dataTransfer } from '../../../map-share-common';
import { makeDataTransferMaps } from '../makeDataTransferMaps';
import { dbx } from '../peripherals/dropbox';

declare module 'micro' {
  export function send<T>(res: ServerResponse, code: number, data?: T): T;
}

function asArray<T>(arg: T | T[]): T[] {
  return Array.isArray(arg) ? arg : [arg];
}

const toKilobytes = (bytes: number) => `${Math.round(bytes / 1000)}KB`;

type UploadResult = dataTransfer.Maps | 'No file uploaded.';

export const uploadHandler: RequestHandler = upload(
  async (req, res): Promise<UploadResult> => {
    if (req.files) {
      const files = asArray(req.files.file);
      const uploadedMapsMetadata = await Promise.all(
        files.map(({ data, name }) => {
          // tslint:disable-next-line:no-console
          console.log('Uploading', name, toKilobytes(data.byteLength));

          return dbx.filesUpload({
            path: `/${name}`,
            contents: data,
            autorename: true,
            mode: { '.tag': 'add' },
          });
        })
      );

      return makeDataTransferMaps(uploadedMapsMetadata);
    }

    return send(res, 400, 'No file uploaded.');
  }
);
