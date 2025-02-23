package tests

import (
	"path"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/kiali/kiali/kubernetes"
	"github.com/kiali/kiali/tests/integration/utils"
	"github.com/kiali/kiali/tests/integration/utils/kiali"
	"github.com/kiali/kiali/tools/cmd"
)

func TestIstioConfigList(t *testing.T) {
	require := require.New(t)
	filePath := path.Join(cmd.KialiProjectRoot, kiali.ASSETS+"/bookinfo-k8sgateways.yaml")
	defer utils.DeleteFile(filePath, kiali.BOOKINFO)
	require.True(utils.ApplyFile(filePath, kiali.BOOKINFO))

	configList, err := kiali.IstioConfigsList(kiali.BOOKINFO)

	require.NoError(err)
	assertConfigs(*configList, require)
}

func TestIstioConfigs(t *testing.T) {
	require := require.New(t)
	filePath := path.Join(cmd.KialiProjectRoot, kiali.ASSETS+"/bookinfo-k8sgateways.yaml")
	defer utils.DeleteFile(filePath, kiali.BOOKINFO)
	require.True(utils.ApplyFile(filePath, kiali.BOOKINFO))
	configMap, err := kiali.IstioConfigs()

	require.NoError(err)
	require.NotEmpty(configMap)
	assertConfigs(*configMap["bookinfo"], require)
}

func assertConfigs(configList kiali.IstioConfigListJson, require *require.Assertions) {
	require.NotEmpty(configList)
	require.NotNil(configList.IstioValidations)
	require.Equal(kiali.BOOKINFO, configList.Namespace.Name)

	require.NotNil(configList.DestinationRules)
	for _, dr := range configList.DestinationRules {
		require.True(dr.Namespace == configList.Namespace.Name)
		require.NotNil(dr.Name)
	}
	require.NotNil(configList.VirtualServices)
	for _, vs := range configList.VirtualServices {
		require.True(vs.Namespace == configList.Namespace.Name)
		require.NotNil(vs.Name)
	}
	require.NotNil(configList.PeerAuthentications)
	for _, pa := range configList.PeerAuthentications {
		require.True(pa.Namespace == configList.Namespace.Name)
		require.NotNil(pa.Name)
	}
	require.NotNil(configList.ServiceEntries)
	for _, se := range configList.ServiceEntries {
		require.True(se.Namespace == configList.Namespace.Name)
		require.NotNil(se.Name)
	}
	require.NotNil(configList.Sidecars)
	for _, sc := range configList.Sidecars {
		require.True(sc.Namespace == configList.Namespace.Name)
		require.NotNil(sc.Name)
	}
	require.NotNil(configList.AuthorizationPolicies)
	for _, ap := range configList.AuthorizationPolicies {
		require.True(ap.Namespace == configList.Namespace.Name)
		require.NotNil(ap.Name)
	}
	require.NotNil(configList.Gateways)
	for _, gw := range configList.Gateways {
		require.True(gw.Namespace == configList.Namespace.Name)
		require.NotNil(gw.Name)
	}
	require.NotNil(configList.K8sGateways)
	for _, gw := range configList.K8sGateways {
		require.True(gw.Namespace == configList.Namespace.Name)
		require.NotNil(gw.Name)
	}
	require.NotNil(configList.K8sGRPCRoutes)
	for _, gw := range configList.K8sGRPCRoutes {
		require.True(gw.Namespace == configList.Namespace.Name)
		require.NotNil(gw.Name)
	}
	require.NotNil(configList.K8sHTTPRoutes)
	for _, gw := range configList.K8sHTTPRoutes {
		require.True(gw.Namespace == configList.Namespace.Name)
		require.NotNil(gw.Name)
	}
	require.NotNil(configList.K8sReferenceGrants)
	for _, rg := range configList.K8sReferenceGrants {
		require.True(rg.Namespace == configList.Namespace.Name)
		require.NotNil(rg.Name)
	}
	require.NotNil(configList.K8sTCPRoutes)
	for _, route := range configList.K8sTCPRoutes {
		require.True(route.Namespace == configList.Namespace.Name)
		require.NotNil(route.Name)
	}
	require.NotNil(configList.K8sTLSRoutes)
	for _, route := range configList.K8sTLSRoutes {
		require.True(route.Namespace == configList.Namespace.Name)
		require.NotNil(route.Name)
	}
	require.NotNil(configList.RequestAuthentications)
	for _, ra := range configList.RequestAuthentications {
		require.True(ra.Namespace == configList.Namespace.Name)
		require.NotNil(ra.Name)
	}
	require.NotNil(configList.WorkloadEntries)
	for _, we := range configList.WorkloadEntries {
		require.True(we.Namespace == configList.Namespace.Name)
		require.NotNil(we.Name)
	}
	require.NotNil(configList.WorkloadGroups)
	for _, wg := range configList.WorkloadGroups {
		require.True(wg.Namespace == configList.Namespace.Name)
		require.NotNil(wg.Name)
	}
	require.NotNil(configList.EnvoyFilters)
	for _, ef := range configList.EnvoyFilters {
		require.True(ef.Namespace == configList.Namespace.Name)
		require.NotNil(ef.Name)
	}
}

func TestIstioConfigDetails(t *testing.T) {
	name := "bookinfo"
	require := require.New(t)
	config, _, err := kiali.IstioConfigDetails(kiali.BOOKINFO, name, kubernetes.VirtualServices)

	require.NoError(err)
	require.NotNil(config)
	require.Equal(kubernetes.VirtualServices, config.ObjectType)
	require.Equal(kiali.BOOKINFO, config.Namespace.Name)
	require.NotNil(config.VirtualService)
	require.Equal(name, config.VirtualService.Name)
	require.Equal(kiali.BOOKINFO, config.VirtualService.Namespace)
	require.NotNil(config.IstioReferences)
	require.NotNil(config.IstioValidation)
	require.Equal(name, config.IstioValidation.Name)
	require.Equal("virtualservice", config.IstioValidation.ObjectType)
	if !config.IstioValidation.Valid {
		require.NotEmpty(config.IstioValidation.References)
	}
}

func TestIstioConfigInvalidName(t *testing.T) {
	name := "invalid"
	require := require.New(t)
	config, code, _ := kiali.IstioConfigDetails(kiali.BOOKINFO, name, kubernetes.VirtualServices)
	require.NotEqual(200, code)
	require.Empty(config)
}

func TestIstioConfigPermissions(t *testing.T) {
	require := require.New(t)
	perms, err := kiali.IstioConfigPermissions(kiali.BOOKINFO)

	require.NoError(err)
	require.NotEmpty(perms)
	require.NotEmpty((*perms)[kiali.BOOKINFO])
	require.NotEmpty((*(*perms)[kiali.BOOKINFO])["authorizationpolicies"])
}
