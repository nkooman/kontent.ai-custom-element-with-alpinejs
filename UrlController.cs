public class UrlController( IPagePathsRetriever pagePathsRetriever, IConfiguration configuration, IDeliveryClient deliveryClient ) : BaseApiController
{
    [HttpGet( "is-unique" )]
    public async Task<IActionResult> IsUrlUnique( [FromQuery] string url )
    {
        var pagePaths = await pagePathsRetriever.GetPagePathsAsync( skipCache: true );

        if ( pagePaths.TryGetValue( url, out var page ) )
        {
            return Ok(new Result(
                IsUnique: false,
                Name: page.System.Name,
                Id: page.System.Id,
                Url: GetKontentUrl( page.System.Id ) ));
        }

        return Ok( new Result( true ) );
    }

    private string GetKontentUrl( string itemId ) => $"https://app.kontent.ai/{configuration["DeliveryOptions:ProjectId"]}/content-inventory/00000000-0000-0000-0000-000000000000/content/{itemId}";

    private sealed record Result(
        bool IsUnique,
        string? Name = "",
        string? Id = "",
        string? Url = ""
    );
}
