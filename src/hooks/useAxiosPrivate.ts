// Returns the authenticated axios instance. The refresh/logout interceptor lives in
// src/api/axios.ts and is registered once for the whole app, so this hook is only a
// stable accessor (kept so components can keep `[axiosPrivate]` in their effect deps).

import { AxiosInstance } from 'axios';
import axiosPrivate from '../api/axios';

const useAxiosPrivate = (): AxiosInstance => axiosPrivate;

export default useAxiosPrivate;
