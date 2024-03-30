public class PagePathsRetriever( IDeliveryClient deliveryClient ) : IPagePathsRetriever
{
    public async Task<Dictionary<string, Generated.Page>> GetPagePathsAsync( bool skipCache = false )
    {
        var sitemap = await GetSitemap();
        var uniqueSubPaths = new Dictionary<string, Generated.Page>();

        if ( sitemap == null )
        {
            return uniqueSubPaths;
        }

        var paths = GetAllSubPaths( sitemap );

        foreach ( var pages in paths )
        {
            var finalPage = pages.LastOrDefault();
            var path = string.Join( '/', pages.Select( page => page.Url.Trim( '/' ) ) );

            if ( finalPage is null || uniqueSubPaths.ContainsKey( path ) )
            {
                continue;
            }

            uniqueSubPaths.TryAdd( path, finalPage );

            try
            {
                var aliases = JsonSerializer
                    .Deserialize<string[]>( finalPage.DomainAliases )
                    ?.Select( alias => alias.Trim( '/' ) )
                    ?? Enumerable.Empty<string>();

                foreach ( var alias in aliases )
                {
                    uniqueSubPaths.TryAdd( alias, finalPage );
                }
            }
            catch ( Exception )
            {
                // Do nothing. Parsing will fail on an empty string.
            }
        }

        return uniqueSubPaths;
    }

    private async Task<Generated.Sitemap?> GetSitemap()
    {
        var response = await deliveryClient.GetItemsAsync<Generated.Sitemap>(
            new ElementsParameter(
                Generated.Sitemap.PagesCodename,
                Generated.Page.PagesCodename,
                Generated.Page.UrlCodename,
                Generated.Page.ContentCodename,
                Generated.Page.TitleCodename,
                Generated.Page.DomainAliasesCodename
            ),
            new LimitParameter( 1 ),
            new DepthParameter( Constants.Kontent.SitemapMaximumDepth ) );

        var sitemap = response.Items.FirstOrDefault();
        return sitemap;
    }

    private static List<List<Generated.Page>> GetAllSubPaths( Generated.Sitemap sitemap )
        => sitemap
            .Pages
            .OfType<Generated.Page>()
            .SelectMany( TraversePaths ) // Get all paths
            .Select( path => path.ToList() )
            .SelectMany( path => path.Select( ( _, index ) => path.Take( index + 1 ) ) ) // Create all possible subpaths
            .Where( subpath => subpath.LastOrDefault()?.Content?.FirstOrDefault() is not null ) // Filter out subpaths that do not contain content
            .Select( path => path.ToList() )
            .ToList();

    private static IEnumerable<IEnumerable<Generated.Page>> TraversePaths( Generated.Page page, int depth = 0 )
    {
        if ( !page.Pages.Any() )
        {
            yield return new List<Generated.Page> { page };
        }

        if ( depth > Constants.Kontent.SitemapMaximumDepth )
        {
            yield break;
        }

        foreach ( var child in page.Pages.OfType<Generated.Page>() )
        {
            foreach ( var path in TraversePaths( child, depth + 1 ) )
            {
                yield return new List<Generated.Page> { page }.Concat( path );
            }
        }
    }
}