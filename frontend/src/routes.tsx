import { MenuItem, Path } from './types/Routes';
import { Paths } from './config';
import { WorkloadListPage } from './pages/WorkloadList/WorkloadListPage';
import { ServiceListPage } from './pages/ServiceList/ServiceListPage';
import { IstioConfigListPage } from './pages/IstioConfigList/IstioConfigListPage';
import { AppListPage } from './pages/AppList/AppListPage';
import { OverviewPage } from './pages/Overview/OverviewPage';
import { GraphPage } from 'pages/Graph/GraphPage';
import { MeshPage } from 'pages/Mesh/MeshPage';
import { GraphRoute } from 'routes/GraphRoute';
import { ServiceDetailsRoute } from 'routes/ServiceDetailsRoute';
import { WorkloadDetailsRoute } from 'routes/WorkloadDetailsRoute';
import { AppDetailsRoute } from 'routes/AppDetailsRoute';
import { IstioConfigDetailsRoute } from 'routes/IstioConfigDetailsRoute';
import { IstioConfigNewRoute } from 'routes/IstioConfigNewRoute';
import { GraphRoutePF } from 'routes/GraphRoutePF';
import { GraphPagePF } from 'pages/GraphPF/GraphPagePF';
import { OldMeshPage } from 'pages/Mesh/old/OldMeshPage';

/**
 * Return array of objects that describe vertical menu
 * @return {array}
 */
const navMenuItems: MenuItem[] = [
  {
    title: 'Overview',
    to: '/overview',
    pathsActive: [/^\/overview\/(.*)/]
  },
  {
    title: 'Traffic Graph [Cy]',
    to: '/graph/namespaces/',
    pathsActive: [/^\/graph\/(.*)/]
  },
  {
    title: 'Traffic Graph [PF]',
    to: '/graphpf/namespaces/',
    pathsActive: [/^\/graphpf\/(.*)/]
  },
  {
    title: 'Applications',
    to: '/' + Paths.APPLICATIONS,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.APPLICATIONS + '/(.*)')]
  },
  {
    title: 'Workloads',
    to: '/' + Paths.WORKLOADS,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.WORKLOADS + '/(.*)')]
  },
  {
    title: 'Services',
    to: '/' + Paths.SERVICES,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.SERVICES + '/(.*)')]
  },
  {
    title: 'Istio Config',
    to: '/' + Paths.ISTIO,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.ISTIO + '/(.*)'), new RegExp('/' + Paths.ISTIO + '/new/(.*)')]
  },
  {
    title: 'Distributed Tracing',
    to: '/tracing'
  },
  {
    title: 'Mesh [graph]',
    to: '/mesh'
  },
  {
    title: 'Mesh [classic]',
    to: '/oldmesh'
  }
];

const defaultRoute = '/overview';

const pathRoutes: Path[] = [
  {
    path: '/overview',
    component: OverviewPage
  },
  {
    path: `/graph/node/namespaces/:namespace/${Paths.AGGREGATES}/:aggregate/:aggregateValue`,
    component: GraphRoute
  },
  {
    path: `/graph/node/namespaces/:namespace/${Paths.APPLICATIONS}/:app/versions/:version`,
    component: GraphRoute
  },
  {
    path: `/graph/node/namespaces/:namespace/${Paths.APPLICATIONS}/:app`,
    component: GraphRoute
  },
  {
    path: `/graph/node/namespaces/:namespace/${Paths.SERVICES}/:service`,
    component: GraphRoute
  },
  {
    path: '/graph/node/namespaces/:namespace/' + Paths.WORKLOADS + '/:workload',
    component: GraphRoute
  },
  {
    path: '/graph/namespaces',
    component: GraphPage
  },
  {
    path: `/graphpf/node/namespaces/:namespace/${Paths.AGGREGATES}/:aggregate/:aggregateValue`,
    component: GraphRoutePF
  },
  {
    path: `/graphpf/node/namespaces/:namespace/${Paths.APPLICATIONS}/:app/versions/:version`,
    component: GraphRoutePF
  },
  {
    path: `/graphpf/node/namespaces/:namespace/${Paths.APPLICATIONS}/:app`,
    component: GraphRoutePF
  },
  {
    path: `/graphpf/node/namespaces/:namespace/${Paths.SERVICES}/:service`,
    component: GraphRoutePF
  },
  {
    path: `/graphpf/node/namespaces/:namespace/${Paths.WORKLOADS}/:workload`,
    component: GraphRoutePF
  },
  {
    path: '/graphpf/namespaces',
    component: GraphPagePF
  },
  {
    path: `/namespaces/:namespace/${Paths.SERVICES}/:service`,
    component: ServiceDetailsRoute
  },
  {
    path: `/namespaces/:namespace/${Paths.ISTIO}/:objectType/:object`,
    component: IstioConfigDetailsRoute
  },
  {
    path: `/${Paths.SERVICES}`,
    component: ServiceListPage
  },
  {
    path: `/${Paths.APPLICATIONS}`,
    component: AppListPage
  },
  {
    path: `/namespaces/:namespace/${Paths.APPLICATIONS}/:app`,
    component: AppDetailsRoute
  },
  {
    path: `/${Paths.WORKLOADS}`,
    component: WorkloadListPage
  },
  {
    path: `/namespaces/:namespace/${Paths.WORKLOADS}/:workload`,
    component: WorkloadDetailsRoute
  },
  {
    path: '/' + Paths.ISTIO + '/new/:objectType',
    component: IstioConfigNewRoute
  },
  {
    path: `/${Paths.ISTIO}`,
    component: IstioConfigListPage
  },
  {
    path: `/${Paths.TRACING}`,
    component: undefined
  },
  {
    path: `/${Paths.MESH}`,
    component: MeshPage
  },
  {
    path: '/oldmesh',
    component: OldMeshPage
  }
];

export { defaultRoute, navMenuItems, pathRoutes };
