import path from 'path';

export default class AppPaths {
    static replaceAsar(path = "") {
        return path.replace(".asar", ".asar.unpacked");
    }
}